import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const filePath = path.join(dataDir, 'reminders.json')

async function ensureStore() {
  await mkdir(dataDir, { recursive: true })
  try {
    await readFile(filePath, 'utf8')
  } catch {
    await writeFile(filePath, JSON.stringify({ users: {} }, null, 2), 'utf8')
  }
}

export async function loadReminders() {
  await ensureStore()
  const raw = await readFile(filePath, 'utf8')
  try {
    const parsed = JSON.parse(raw)
    if (!parsed.users || typeof parsed.users !== 'object') return { users: {} }
    return parsed
  } catch {
    return { users: {} }
  }
}

export async function saveReminders(data) {
  await ensureStore()
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
}

export async function upsertReminder(userId, patch) {
  const id = String(userId)
  const db = await loadReminders()
  const prev = db.users[id] || {}
  db.users[id] = {
    ...prev,
    ...patch,
    userId: id,
    updatedAt: Date.now(),
  }
  if (!db.users[id].enabled) {
    delete db.users[id]
  }
  await saveReminders(db)
  return db.users[id] || null
}

export async function listEnabledReminders() {
  const db = await loadReminders()
  return Object.values(db.users).filter((item) => item?.enabled && item.lat != null && item.lng != null)
}
