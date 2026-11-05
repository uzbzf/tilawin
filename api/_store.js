const g = globalThis
if (!g.__tilawinReminders) g.__tilawinReminders = new Map()

export async function put(key, value) {
  if (value == null) g.__tilawinReminders.delete(key)
  else g.__tilawinReminders.set(key, value)
  return value
}

export async function get(key) {
  return g.__tilawinReminders.get(key) || null
}

export async function list(prefix = 'reminder:') {
  const out = []
  for (const [key, value] of g.__tilawinReminders.entries()) {
    if (key.startsWith(prefix) && value?.enabled) out.push(value)
  }
  return out
}
