const KEY = 'tilawin-reminders'

function apiBase() {
  const raw = import.meta.env.VITE_API_URL
  if (raw == null || raw === '') return ''
  return String(raw).replace(/\/$/, '')
}

export function readReminderLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function writeReminderLocal(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export async function setPrayerReminder({
  enabled,
  userId,
  initData,
  lat,
  lng,
  city,
  offsetMinutes = 0,
  fridayKahf = false,
}) {
  const payload = {
    enabled: Boolean(enabled),
    userId,
    initData: initData || '',
    lat,
    lng,
    city: city || '',
    offsetMinutes: Number(offsetMinutes) || 0,
    fridayKahf: Boolean(fridayKahf),
  }

  writeReminderLocal({
    enabled: payload.enabled,
    offsetMinutes: payload.offsetMinutes,
    fridayKahf: payload.fridayKahf,
    city: payload.city,
    lat,
    lng,
    updatedAt: Date.now(),
  })

  try {
    const response = await fetch(`${apiBase()}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || 'Reminder API failed')
    }

    return response.json()
  } catch (error) {
    if (!import.meta.env.PROD) {
      return { ok: true, offline: true, ...payload }
    }
    throw error
  }
}
