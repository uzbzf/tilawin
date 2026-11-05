import { useEffect, useState } from 'react'
import { fetchSchedule, getSchedule } from '../lib/prayer'

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function usePrayerTimes(lat, lng) {
  const [now, setNow] = useState(() => new Date())
  const [remote, setRemote] = useState(null)
  const today = dayKey(now)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (lat == null || lng == null) return undefined
    let cancelled = false
    setRemote(null)

    fetchSchedule(lat, lng, new Date())
      .then((schedule) => {
        if (!cancelled) setRemote(schedule)
      })
      .catch(() => {
        if (!cancelled) setRemote(null)
      })

    return () => {
      cancelled = true
    }
  }, [lat, lng, today])

  if (lat == null || lng == null) return { now, schedule: null }

  if (remote?.times) {
    return { now, schedule: getScheduleFromCached(remote, now) }
  }

  return { now, schedule: getSchedule(lat, lng, now) }
}

function getScheduleFromCached(cached, now) {
  const times = cached.times
  const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  let nextName = order.find((name) => times[name] > now)
  let nextTime = nextName ? times[nextName] : cached.nextTime
  let previousName = cached.previousName
  let previousTime = cached.previousTime

  if (nextName) {
    const index = order.indexOf(nextName)
    nextTime = times[nextName]
    if (index === 0) {
      previousName = cached.previousName || 'isha'
      previousTime = cached.previousTime || times.isha
    } else {
      previousName = order[index - 1]
      previousTime = times[previousName]
    }
  } else {
    nextName = 'fajr'
    nextTime = cached.nextTime
    previousName = 'isha'
    previousTime = times.isha
  }

  const span = nextTime - previousTime
  const remaining = nextTime - now
  return {
    ...cached,
    nextName,
    nextTime,
    previousName,
    previousTime,
    remaining,
    progress: span > 0 ? Math.min(Math.max((now - previousTime) / span, 0), 1) : 0,
    isNow: remaining <= 0,
  }
}
