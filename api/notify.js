import { formatReminderMessage, tg } from './_telegram.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const userId = body.userId
    if (!userId || !body.prayer || !body.time) {
      res.status(400).json({ ok: false, error: 'userId, prayer, time required' })
      return
    }

    await tg('sendMessage', {
      chat_id: userId,
      text: formatReminderMessage({
        prayer: body.prayer,
        time: body.time,
        city: body.city || '',
        minutes: Number(body.minutes) || 15,
      }),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })

    res.status(200).json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message, code: error.code })
  }
}
