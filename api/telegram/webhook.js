export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }

  const token = process.env.BOT_TOKEN
  const webAppUrl = process.env.WEBAPP_URL || 'https://tilawin.vercel.app'
  const update = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const message = update.message
  const text = message?.text?.trim() || ''

  if (token && message?.chat?.id && (text === '/start' || text.startsWith('/start ') || text === '/help')) {
    const body =
      text === '/help'
        ? {
            chat_id: message.chat.id,
            text: 'Команды:\n/start — открыть хаб\n/help — справка\n\nНапоминания включаются внутри Mini App.',
          }
        : {
            chat_id: message.chat.id,
            text: 'Assalamu alaikum! Это All-in-One Hub TILAWIN.\nОткройте Mini App ниже.',
            reply_markup: {
              inline_keyboard: [[{ text: 'Open TILAWIN Hub', web_app: { url: webAppUrl } }]],
            },
          }

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
  }

  res.status(200).json({ ok: true })
}
