import { tg } from './_telegram.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false })
    return
  }

  try {
    if (!process.env.BOT_TOKEN) {
      res.status(200).json({ ok: true, username: 'tilawin_bot', link: 'https://t.me/tilawin_bot' })
      return
    }
    const me = await tg('getMe', {})
    const username = me.username || 'tilawin_bot'
    res.status(200).json({
      ok: true,
      username,
      link: `https://t.me/${username}`,
      name: me.first_name || 'TILAWIN',
    })
  } catch (error) {
    res.status(200).json({
      ok: false,
      username: 'tilawin_bot',
      link: 'https://t.me/tilawin_bot',
      error: error.message,
    })
  }
}
