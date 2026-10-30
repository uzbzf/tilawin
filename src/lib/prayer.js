import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan'

export const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_LABELS = {
  fajr: 'Фаджр',
  dhuhr: 'Зухр',
  asr: 'Аср',
  maghrib: 'Магриб',
  isha: 'Иша',
}

const ALADHAN_KEYS = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

function params() {
  const next = CalculationMethod.MuslimWorldLeague()
  next.madhab = Madhab.Hanafi
  return next
}

export function getPrayerTimes(lat, lng, date = new Date()) {
  const coordinates = new Coordinates(lat, lng)
  return new PrayerTimes(coordinates, date, params())
}

export function formatClock(date, timeZone) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone || undefined,
  })
}

export function formatCountdown(ms) {
  if (ms < 0) ms = 0
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function pad(n) {
  return String(n).padStart(2, '0')
}

/** Build a Date for YYYY-MM-DD HH:mm in a named IANA timezone. */
export function zonedDate(timeZone, year, month, day, hour, minute) {
  const utc = Date.UTC(year, month - 1, day, hour, minute, 0)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const asUtcParts = (date) => {
    const p = Object.fromEntries(dtf.formatToParts(date).map((part) => [part.type, part.value]))
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  }
  return new Date(utc - (asUtcParts(new Date(utc)) - utc))
}

function parseHHmm(hhmm, timeZone, now) {
  const [hour, minute] = hhmm.split(':').map(Number)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type) => parts.find((p) => p.type === type).value
  return zonedDate(timeZone, +get('year'), +get('month'), +get('day'), hour, minute)
}

function buildSchedule(times, now, extra = {}) {
  let nextName = PRAYER_ORDER.find((name) => times[name] > now)
  let nextTime
  let previousName
  let previousTime

  if (nextName) {
    nextTime = times[nextName]
    const index = PRAYER_ORDER.indexOf(nextName)
    previousName = extra.previousName || (index === 0 ? 'isha' : PRAYER_ORDER[index - 1])
    previousTime = extra.previousTime || times[previousName]
  } else {
    nextName = 'fajr'
    nextTime = extra.tomorrowFajr
    previousName = 'isha'
    previousTime = times.isha
  }

  const span = nextTime - previousTime
  const elapsed = now - previousTime
  const progress = span > 0 ? Math.min(Math.max(elapsed / span, 0), 1) : 0
  const remaining = nextTime - now

  return {
    times,
    nextName,
    nextTime,
    previousName,
    previousTime,
    progress,
    remaining,
    isNow: remaining <= 0,
    timeZone: extra.timeZone,
    source: extra.source || 'local',
  }
}

export function getSchedule(lat, lng, now = new Date()) {
  const today = getPrayerTimes(lat, lng, now)
  const times = Object.fromEntries(PRAYER_ORDER.map((name) => [name, today[name]]))
  const extra = {}

  if (times.fajr <= now) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    extra.previousName = 'isha'
    extra.previousTime = getPrayerTimes(lat, lng, yesterday).isha
  }

  if (times.isha <= now) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    extra.tomorrowFajr = getPrayerTimes(lat, lng, tomorrow).fajr
  }

  extra.source = 'local'
  return buildSchedule(times, now, extra)
}

export async function fetchSchedule(lat, lng, now = new Date()) {
  const stamp = Math.floor(now.getTime() / 1000)
  const url = `https://api.aladhan.com/v1/timings/${stamp}?latitude=${lat}&longitude=${lng}&method=3&school=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('aladhan failed')
  const json = await res.json()
  const timeZone = json.data.meta.timezone
  const raw = json.data.timings
  const times = Object.fromEntries(
    PRAYER_ORDER.map((name) => [name, parseHHmm(raw[ALADHAN_KEYS[name]], timeZone, now)]),
  )

  const extra = { timeZone, source: 'aladhan' }

  if (times.fajr <= now) {
    const yStamp = stamp - 24 * 60 * 60
    const yRes = await fetch(
      `https://api.aladhan.com/v1/timings/${yStamp}?latitude=${lat}&longitude=${lng}&method=3&school=1`,
    )
    if (yRes.ok) {
      const yJson = await yRes.json()
      extra.previousName = 'isha'
      extra.previousTime = parseHHmm(yJson.data.timings.Isha, yJson.data.meta.timezone, new Date(now.getTime() - 86400000))
    }
  }

  if (times.isha <= now) {
    const tStamp = stamp + 24 * 60 * 60
    const tRes = await fetch(
      `https://api.aladhan.com/v1/timings/${tStamp}?latitude=${lat}&longitude=${lng}&method=3&school=1`,
    )
    if (tRes.ok) {
      const tJson = await tRes.json()
      extra.tomorrowFajr = parseHHmm(
        tJson.data.timings.Fajr,
        tJson.data.meta.timezone,
        new Date(now.getTime() + 86400000),
      )
    }
  }

  return buildSchedule(times, now, extra)
}

export { pad }
