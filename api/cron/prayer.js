import { list } from '../_store.js'

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const sent = globalThis.__tilawinSent || (globalThis.__tilawinSent = new Map())

function parseTodayTime(hhmm, now = new Date()) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const date = new Date(now)
  date.setHours(h, m, 0, 0)
  return date
}

async function fetchSchedule(lat, lng) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=3&school=1`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Aladhan failed')
  const data = await response.json()
  return data?.data?.timings || null
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }

  const token = process.env.BOT_TOKEN
  if (!token) {
    res.status(200).json({ ok: false, error: 'BOT_TOKEN missing' })
    return
  }

  const users = await list('reminder:')
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const intervalMs = 60_000
  let sentCount = 0

  for (const user of users) {
    try {
      const timings = await fetchSchedule(user.lat, user.lng)
      if (!timings) continue
      const offset = Number(user.offsetMinutes) || 15
      for (const prayer of PRAYER_ORDER) {
        const stamp = timings[prayer]
        if (!stamp) continue
        const prayerAt = parseTodayTime(stamp, now)
        const remindAt = new Date(prayerAt.getTime() - offset * 60_000)
        const diff = now.getTime() - remindAt.getTime()
        if (diff < 0 || diff > intervalMs * 1.5) continue
        const key = `${user.userId}:${day}:${prayer}`
        if (sent.has(key)) continue
        sent.set(key, Date.now())
        const city = user.city ? ` (${user.city})` : ''
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.userId,
            text: `⏰ Через ${offset} мин — <b>${prayer}</b>${city}.\nВремя намаза: <b>${stamp}</b>.`,
            parse_mode: 'HTML',
          }),
        })
        sentCount += 1
      }
    } catch {
      /* continue */
    }
  }

  res.status(200).json({ ok: true, users: users.length, sent: sentCount })
}
