import { list } from '../_store.js'
import { formatReminderMessage, tg } from '../_telegram.js'

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
  const secret = process.env.CRON_SECRET
  // Allow Vercel Cron (no secret) or external cron with Bearer secret
  const fromVercel = Boolean(req.headers['x-vercel-cron'])
  if (secret && !fromVercel && auth !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }

  if (!process.env.BOT_TOKEN) {
    res.status(200).json({ ok: false, error: 'BOT_TOKEN missing' })
    return
  }

  const users = await list('reminder:')
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const windowMs = 90_000
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
        if (diff < 0 || diff > windowMs) continue

        const key = `${user.userId}:${day}:${prayer}`
        if (sent.has(key)) continue
        sent.set(key, Date.now())

        await tg('sendMessage', {
          chat_id: user.userId,
          text: formatReminderMessage({
            prayer,
            time: stamp,
            city: user.city,
            minutes: offset,
          }),
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        })
        sentCount += 1
      }
    } catch (error) {
      console.error(`[cron] ${user.userId}`, error.message)
    }
  }

  res.status(200).json({ ok: true, users: users.length, sent: sentCount })
}
