import { put } from './_store.js'
import { fetchNextPrayer, formatEnabledMessage, tg } from './_telegram.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
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
      let next = null
      try {
        next = await fetchNextPrayer(reminder.lat, reminder.lng)
      } catch {
        /* ignore */
      }

      let delivered = false
      let needStart = false
      if (process.env.BOT_TOKEN) {
        try {
          await tg('sendMessage', {
            chat_id: userId,
            text: formatEnabledMessage({
              nextName: next?.name,
              nextTime: next?.time,
              city: reminder.city,
              minutes: reminder.offsetMinutes,
            }),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          })
          delivered = true
        } catch (error) {
          needStart = error?.code === 403 || /blocked|chat not found|initiate/i.test(error.message || '')
        }
      }

      res.status(200).json({
        ok: true,
        reminder,
        delivered,
        needStart,
        nextPrayer: next ? { name: next.name, time: next.time } : null,
      })
      return
    }

    await put(`reminder:${userId}`, null)
    if (process.env.BOT_TOKEN) {
      await tg('sendMessage', {
        chat_id: userId,
        text: '🔕 Напоминания о намазе выключены.\nКогда захочешь — включи снова в Mini App.',
        parse_mode: 'HTML',
      }).catch(() => null)
    }
    res.status(200).json({ ok: true, reminder: null })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
}
