import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const g = globalThis
if (!g.__tilawinReminders) g.__tilawinReminders = new Map()

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server', 'data')
const FILE = path.join(DATA_DIR, 'reminders.json')

async function readDisk() {
  try {
    const raw = await readFile(FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed?.users && typeof parsed.users === 'object' ? parsed.users : {}
  } catch {
    return {}
  }
}

async function writeDisk(users) {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(FILE, JSON.stringify({ users }, null, 2), 'utf8')
  } catch {
    /* read-only serverless FS */
  }
}

async function hydrate() {
  if (g.__tilawinRemindersHydrated) return
  const users = await readDisk()
  Object.entries(users).forEach(([id, value]) => {
    if (value?.enabled) g.__tilawinReminders.set(`reminder:${id}`, value)
  })
  g.__tilawinRemindersHydrated = true
}

async function persistAll() {
  const users = {}
  for (const [key, value] of g.__tilawinReminders.entries()) {
    if (key.startsWith('reminder:') && value?.enabled) {
      users[value.userId] = value
    }
  }
  await writeDisk(users)

  // Optional durable remote JSON (JSONBin / custom) if configured
  const remote = process.env.REMINDERS_STORE_URL
  const key = process.env.REMINDERS_STORE_KEY
  if (!remote) return
  try {
    await fetch(remote, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'X-Master-Key': key, Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({ users }),
    })
  } catch {
    /* ignore */
  }
}

async function loadRemote() {
  const remote = process.env.REMINDERS_STORE_URL
  const key = process.env.REMINDERS_STORE_KEY
  if (!remote) return
  try {
    const response = await fetch(remote, {
      headers: key ? { 'X-Master-Key': key, Authorization: `Bearer ${key}` } : {},
    })
    if (!response.ok) return
    const data = await response.json()
    const users = data?.users || data?.record?.users || {}
    Object.entries(users).forEach(([id, value]) => {
      if (value?.enabled) g.__tilawinReminders.set(`reminder:${id}`, value)
    })
  } catch {
    /* ignore */
  }
}

export async function put(key, value) {
  await hydrate()
  await loadRemote()
  if (value == null) g.__tilawinReminders.delete(key)
  else g.__tilawinReminders.set(key, value)
  await persistAll()
  return value
}

export async function get(key) {
  await hydrate()
  await loadRemote()
  return g.__tilawinReminders.get(key) || null
}

export async function list(prefix = 'reminder:') {
  await hydrate()
  await loadRemote()
  const out = []
  for (const [key, value] of g.__tilawinReminders.entries()) {
    if (key.startsWith(prefix) && value?.enabled) out.push(value)
  }
  return out
}
