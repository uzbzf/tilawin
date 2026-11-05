import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan'

/** Five fard prayers — used for «next prayer» countdown */
export const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

/** Full day list including sunrise & tahajjud */
export const DISPLAY_ORDER = ['tahajjud', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_LABELS = {
  tahajjud: 'Тахаджуд',
  fajr: 'Фаджр',
  sunrise: 'Восход',
  dhuhr: 'Зухр',
  asr: 'Аср',
  maghrib: 'Магриб',
  isha: 'Иша',
}

const ALADHAN_KEYS = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  lastthird: 'Lastthird',
}

function params() {
  const next = CalculationMethod.MuslimWorldLeague()
  next.madhab = Madhab.Hanafi
  return next
}

function tahajjudFromNight(maghrib, fajr) {
  const night = fajr.getTime() - maghrib.getTime()
  if (!(night > 0)) return new Date(fajr.getTime() - 90 * 60_000)
  return new Date(fajr.getTime() - night / 3)
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
  const [hour, minute] = String(hhmm)
    .split(':')
    .map(Number)
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

function localDayTimes(lat, lng, now) {
  const today = getPrayerTimes(lat, lng, now)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextFajr = getPrayerTimes(lat, lng, tomorrow).fajr

  return {
    tahajjud: tahajjudFromNight(today.maghrib, nextFajr),
    fajr: today.fajr,
    sunrise: today.sunrise,
    dhuhr: today.dhuhr,
    asr: today.asr,
    maghrib: today.maghrib,
    isha: today.isha,
  }
}

export function getSchedule(lat, lng, now = new Date()) {
  const times = localDayTimes(lat, lng, now)
  const fard = Object.fromEntries(PRAYER_ORDER.map((name) => [name, times[name]]))
  const extra = {}

  if (fard.fajr <= now) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    extra.previousName = 'isha'
    extra.previousTime = getPrayerTimes(lat, lng, yesterday).isha
  }

  if (fard.isha <= now) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    extra.tomorrowFajr = getPrayerTimes(lat, lng, tomorrow).fajr
  }

  extra.source = 'local'
  return buildSchedule({ ...times, ...fard }, now, extra)
}

export async function fetchSchedule(lat, lng, now = new Date()) {
  const stamp = Math.floor(now.getTime() / 1000)
  const url = `https://api.aladhan.com/v1/timings/${stamp}?latitude=${lat}&longitude=${lng}&method=3&school=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('aladhan failed')
  const json = await res.json()
  const timeZone = json.data.meta.timezone
  const raw = json.data.timings

  const times = {
    fajr: parseHHmm(raw[ALADHAN_KEYS.fajr], timeZone, now),
    sunrise: parseHHmm(raw[ALADHAN_KEYS.sunrise], timeZone, now),
    dhuhr: parseHHmm(raw[ALADHAN_KEYS.dhuhr], timeZone, now),
    asr: parseHHmm(raw[ALADHAN_KEYS.asr], timeZone, now),
    maghrib: parseHHmm(raw[ALADHAN_KEYS.maghrib], timeZone, now),
    isha: parseHHmm(raw[ALADHAN_KEYS.isha], timeZone, now),
  }

  if (raw.Lastthird) {
    times.tahajjud = parseHHmm(raw.Lastthird, timeZone, now)
  } else {
    const tomorrow = new Date(now.getTime() + 86400000)
    const tStamp = stamp + 24 * 60 * 60
    const tRes = await fetch(
      `https://api.aladhan.com/v1/timings/${tStamp}?latitude=${lat}&longitude=${lng}&method=3&school=1`,
    )
    if (tRes.ok) {
      const tJson = await tRes.json()
      const nextFajr = parseHHmm(tJson.data.timings.Fajr, tJson.data.meta.timezone, tomorrow)
      times.tahajjud = tahajjudFromNight(times.maghrib, nextFajr)
    } else {
      times.tahajjud = tahajjudFromNight(times.maghrib, new Date(times.fajr.getTime() + 86400000))
    }
  }

  const extra = { timeZone, source: 'aladhan' }

  if (times.fajr <= now) {
    const yStamp = stamp - 24 * 60 * 60
    const yRes = await fetch(
      `https://api.aladhan.com/v1/timings/${yStamp}?latitude=${lat}&longitude=${lng}&method=3&school=1`,
    )
    if (yRes.ok) {
      const yJson = await yRes.json()
      extra.previousName = 'isha'
      extra.previousTime = parseHHmm(
        yJson.data.timings.Isha,
        yJson.data.meta.timezone,
        new Date(now.getTime() - 86400000),
      )
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
