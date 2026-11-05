export const HABITS_KEY = 'tilawin-habits'

export const habitDefs = [
  { id: 'fajr', icon: 'sunrise' },
  { id: 'quran', icon: 'book' },
  { id: 'dhikr', icon: 'sparkles' },
  { id: 'sadaqa', icon: 'heart' },
  { id: 'salawat', icon: 'moon' },
]

export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function readHabits() {
  try {
    return JSON.parse(localStorage.getItem(HABITS_KEY) || '{}')
  } catch {
    return {}
  }
}

export function writeHabits(value) {
  try {
    localStorage.setItem(HABITS_KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function calcStreak(daysMap) {
  let streak = 0
  const cursor = new Date()
  for (let i = 0; i < 365; i += 1) {
    const key = todayKey(cursor)
    const day = daysMap[key]
    const done = day && habitDefs.every((habit) => day[habit.id])
    if (!done) {
      if (i === 0) return 0
      break
    }
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
