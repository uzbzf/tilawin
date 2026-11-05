const API = 'https://api.telegram.org'

export function createBot(token) {
  if (!token) return null

  async function call(method, body) {
    const response = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.ok === false) {
      throw new Error(data.description || `Telegram API ${method} failed`)
    }
    return data.result
  }

  return {
    async sendMessage(chatId, text, extra = {}) {
      return call('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...extra,
      })
    },
    async answer(update, text) {
      const chatId = update?.message?.chat?.id
      if (!chatId) return null
      return this.sendMessage(chatId, text)
    },
  }
}

export function handleUpdate(bot, update, { webAppUrl }) {
  if (!bot) return Promise.resolve(null)
  const message = update?.message
  if (!message?.text) return Promise.resolve(null)

  const text = message.text.trim()
  if (text === '/start' || text.startsWith('/start ')) {
    const keyboard = webAppUrl
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: 'Open TILAWIN Hub', web_app: { url: webAppUrl } }]],
          },
        }
      : {}
    return bot.sendMessage(
      message.chat.id,
      'Assalamu alaikum! Это All-in-One Hub TILAWIN.\nОткройте Mini App, включите напоминания о намазе и пользуйтесь тасбихом, аятами и трекером привычек.',
      keyboard,
    )
  }

  if (text === '/help') {
    return bot.sendMessage(
      message.chat.id,
      'Команды:\n/start — открыть хаб\n/help — справка\n\nНапоминания о намазе настраиваются внутри Mini App.',
    )
  }

  return Promise.resolve(null)
}
