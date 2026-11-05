import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan'
import { getAladhanParams, readAsrMadhab, readCalcMethod } from './prayerSettings'

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

function adhanParams(methodId = readCalcMethod(), asrId = readAsrMadhab()) {
  let next
  switch (methodId) {
    case 'isna':
      next = CalculationMethod.NorthAmerica()
      break
    case 'egypt':
      next = CalculationMethod.Egyptian()
      break
    case 'makkah':
      next = CalculationMethod.UmmAlQura()
      break
    case 'fixedIsha': {
      next = CalculationMethod.Other()
      next.fajrAngle = 18
      next.ishaInterval = 90
      break
    }
    case 'mwl':
    default:
      next = CalculationMethod.MuslimWorldLeague()
      break
  }
  next.madhab = asrId === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi
  return next
}

function aladhanQuery(stamp, lat, lng, methodId, asrId) {
  const { method, school, fixedIsha } = getAladhanParams(methodId, asrId)
  let url = `https://api.aladhan.com/v1/timings/${stamp}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`
  if (fixedIsha) url += '&tune=0,0,0,0,0,0,0,0,0'
  return url
}

function tahajjudFromNight(maghrib, fajr) {
  const night = fajr.getTime() - maghrib.getTime()
  if (!(night > 0)) return new Date(fajr.getTime() - 90 * 60_000)
  return new Date(fajr.getTime() - night / 3)
}

export function getPrayerTimes(lat, lng, date = new Date(), methodId, asrId) {
  const coordinates = new Coordinates(lat, lng)
  return new PrayerTimes(coordinates, date, adhanParams(methodId, asrId))
}

/** Last third of the night: Maghrib → next Fajr */
export function calcTahajjud(maghrib, fajr) {
  return tahajjudFromNight(maghrib, fajr)
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

function localDayTimes(lat, lng, now, methodId, asrId) {
  const today = getPrayerTimes(lat, lng, now, methodId, asrId)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextFajr = getPrayerTimes(lat, lng, tomorrow, methodId, asrId).fajr

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

export function getSchedule(lat, lng, now = new Date(), methodId, asrId) {
  const method = methodId || readCalcMethod()
  const asr = asrId || readAsrMadhab()
  const times = localDayTimes(lat, lng, now, method, asr)
  const fard = Object.fromEntries(PRAYER_ORDER.map((name) => [name, times[name]]))
  const extra = {}

  if (fard.fajr <= now) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    extra.previousName = 'isha'
    extra.previousTime = getPrayerTimes(lat, lng, yesterday, method, asr).isha
  }

  if (fard.isha <= now) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    extra.tomorrowFajr = getPrayerTimes(lat, lng, tomorrow, method, asr).fajr
  }

  extra.source = 'local'
  extra.methodId = method
  extra.asrId = asr
  return buildSchedule({ ...times, ...fard }, now, extra)
}

export async function fetchSchedule(lat, lng, now = new Date(), methodId, asrId) {
  const method = methodId || readCalcMethod()
  const asr = asrId || readAsrMadhab()
  const stamp = Math.floor(now.getTime() / 1000)
  const url = aladhanQuery(stamp, lat, lng, method, asr)
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

  // Fixed Isha: force Maghrib + 90 minutes when API method does not apply it
  if (method === 'fixedIsha') {
    times.isha = new Date(times.maghrib.getTime() + 90 * 60_000)
  }

  if (raw.Lastthird) {
    times.tahajjud = parseHHmm(raw.Lastthird, timeZone, now)
  } else {
    const tomorrow = new Date(now.getTime() + 86400000)
    const tStamp = stamp + 24 * 60 * 60
    const tRes = await fetch(aladhanQuery(tStamp, lat, lng, method, asr))
    if (tRes.ok) {
      const tJson = await tRes.json()
      const nextFajr = parseHHmm(tJson.data.timings.Fajr, tJson.data.meta.timezone, tomorrow)
      times.tahajjud = tahajjudFromNight(times.maghrib, nextFajr)
    } else {
      times.tahajjud = tahajjudFromNight(times.maghrib, new Date(times.fajr.getTime() + 86400000))
    }
  }

  const extra = { timeZone, source: 'aladhan', methodId: method, asrId: asr }

  if (times.fajr <= now) {
    const yStamp = stamp - 24 * 60 * 60
    const yRes = await fetch(aladhanQuery(yStamp, lat, lng, method, asr))
    if (yRes.ok) {
      const yJson = await yRes.json()
      extra.previousName = 'isha'
      let prevIsha = parseHHmm(
        yJson.data.timings.Isha,
        yJson.data.meta.timezone,
        new Date(now.getTime() - 86400000),
      )
      if (method === 'fixedIsha') {
        const prevMaghrib = parseHHmm(
          yJson.data.timings.Maghrib,
          yJson.data.meta.timezone,
          new Date(now.getTime() - 86400000),
        )
        prevIsha = new Date(prevMaghrib.getTime() + 90 * 60_000)
      }
      extra.previousTime = prevIsha
    }
  }

  if (times.isha <= now) {
    const tStamp = stamp + 24 * 60 * 60
    const tRes = await fetch(aladhanQuery(tStamp, lat, lng, method, asr))
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
