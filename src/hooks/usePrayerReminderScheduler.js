import { useEffect, useRef } from 'react'
import { readReminderLocal } from '../lib/remindersApi'
import { getTelegramUser, isTelegramWebApp } from '../lib/telegram'

const SENT_KEY = 'tilawin-reminder-sent'
const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function readSent() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeSent(map) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

function parseToday(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  return date
}

async function fetchTimings(lat, lng) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=3&school=1`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  return data?.data?.timings || null
}

/**
 * While Mini App is open, checks prayer windows and asks the bot API to notify.
 * Works together with server cron when available.
 */
export function usePrayerReminderScheduler() {
  const busy = useRef(false)

  useEffect(() => {
    if (!isTelegramWebApp()) return undefined

    const tick = async () => {
      if (busy.current) return
      const local = readReminderLocal()
      const user = getTelegramUser()
      if (!local.enabled || !user?.id || local.lat == null || local.lng == null) return

      busy.current = true
      try {
        const timings = await fetchTimings(local.lat, local.lng)
        if (!timings) return
        const offset = Number(local.offsetMinutes) || 15
        const now = Date.now()
        const day = new Date().toISOString().slice(0, 10)
        const sent = readSent()

        for (const prayer of PRAYERS) {
          const stamp = timings[prayer]
          if (!stamp) continue
          const prayerAt = parseToday(stamp).getTime()
          const remindAt = prayerAt - offset * 60_000
          const diff = now - remindAt
          if (diff < 0 || diff > 90_000) continue

          const key = `${day}:${prayer}`
          if (sent[key]) continue

          const response = await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              prayer,
              time: stamp,
              city: local.city || '',
              minutes: offset,
            }),
          })
          if (response.ok) {
            sent[key] = Date.now()
            writeSent(sent)
          }
        }
      } catch {
        /* ignore */
      } finally {
        busy.current = false
      }
    }

    tick()
    const id = window.setInterval(tick, 20_000)
    return () => window.clearInterval(id)
  }, [])
}
