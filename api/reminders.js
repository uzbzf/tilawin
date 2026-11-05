import { put } from './_store.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function telegram(method, body) {
  const token = process.env.BOT_TOKEN
  if (!token) throw new Error('BOT_TOKEN missing on server')
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!data.ok) throw new Error(data.description || 'Telegram API error')
  return data.result
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const userId = body.userId || body.telegramId
    if (!userId) {
      res.status(400).json({ ok: false, error: 'userId required' })
      return
    }

    const reminder = {
      enabled: Boolean(body.enabled),
      lat: Number(body.lat),
      lng: Number(body.lng),
      city: body.city || '',
      offsetMinutes: Number(body.offsetMinutes) || 15,
      userId: String(userId),
      updatedAt: Date.now(),
    }

    if (reminder.enabled) {
      await put(`reminder:${userId}`, reminder)
      if (process.env.BOT_TOKEN) {
        await telegram('sendMessage', {
          chat_id: userId,
          text: `Напоминания о намазе включены (за ${reminder.offsetMinutes} мин)${reminder.city ? ` · ${reminder.city}` : ''}.`,
        }).catch(() => null)
      }
    } else {
      await put(`reminder:${userId}`, null)
    }

    res.status(200).json({ ok: true, reminder: reminder.enabled ? reminder : null })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
}
