import { formatReminderMessage } from './bot.js'
import { listEnabledReminders } from './store.js'

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const sentCache = new Map()

function cacheKey(userId, prayer, day) {
  return `${userId}:${day}:${prayer}`
}

async function fetchSchedule(lat, lng) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=3&school=1`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Aladhan failed')
  const data = await response.json()
  return data?.data?.timings || null
}

function parseTodayTime(hhmm, now = new Date()) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const date = new Date(now)
  date.setHours(h, m, 0, 0)
  return date
}

export function startReminderCron(bot, { intervalMs = 60_000 } = {}) {
  const tick = async () => {
    if (!bot) return
    let users = []
    try {
      users = await listEnabledReminders()
    } catch (error) {
      console.error('[reminders] load failed', error.message)
      return
    }

    const now = new Date()
    const day = now.toISOString().slice(0, 10)

    await Promise.all(
      users.map(async (user) => {
        try {
          const timings = await fetchSchedule(user.lat, user.lng)
          if (!timings) return
          const offset = Number(user.offsetMinutes) || 15

          for (const prayer of PRAYER_ORDER) {
            const stamp = timings[prayer]
            if (!stamp) continue
            const prayerAt = parseTodayTime(stamp, now)
            const remindAt = new Date(prayerAt.getTime() - offset * 60_000)
            const diff = now.getTime() - remindAt.getTime()
            if (diff < 0 || diff > intervalMs * 1.5) continue

            const key = cacheKey(user.userId, prayer, day)
            if (sentCache.has(key)) continue
            sentCache.set(key, Date.now())

            await bot.sendMessage(
              user.userId,
              formatReminderMessage({
                prayer,
                time: stamp,
                city: user.city,
                minutes: offset,
              }),
            )
          }
        } catch (error) {
          console.error(`[reminders] user ${user.userId}`, error.message)
        }
      }),
    )

    const cutoff = Date.now() - 36 * 60 * 60 * 1000
    for (const [key, ts] of sentCache.entries()) {
      if (ts < cutoff) sentCache.delete(key)
    }
  }

  const timer = setInterval(tick, intervalMs)
  tick().catch(() => {})
  return () => clearInterval(timer)
}
