const API = 'https://api.telegram.org'

const WEBAPP_FALLBACK = 'https://tilawin.vercel.app'

function startText(name) {
  const who = name ? `, <b>${name}</b>` : ''
  return [
    `السلام عليكم${who}!`,
    '',
    'Добро пожаловать в <b>TILAWIN Hub</b> — спокойный помощник для намаза, аятов, тасбиха и добрых привычек.',
    '',
    '✨ Что умеет хаб:',
    '• времена намаза и напоминания за 15 минут',
    '• аяты под настроение (перевод Э. Кулиева)',
    '• электронный тасбих и трекер привычек',
    '• обои с каллиграфией',
    '',
    'Нажми кнопку ниже, чтобы открыть Mini App.',
  ].join('\n')
}

function linksKeyboard(webAppUrl) {
  return {
    inline_keyboard: [
      [{ text: '🕊 Открыть TILAWIN Hub', web_app: { url: webAppUrl } }],
      [
        { text: '📢 Канал', url: 'https://t.me/tilawin' },
        { text: '💬 Связь', url: 'https://t.me/tilawin7' },
      ],
      [
        { text: '📸 Instagram', url: 'https://www.instagram.com/tilawin_' },
        { text: '🎵 TikTok', url: 'https://www.tiktok.com/@tilawin_' },
      ],
    ],
  }
}

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
      const err = new Error(data.description || `Telegram API ${method} failed`)
      err.code = data.error_code
      throw err
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

export const PRAYER_LABELS = {
  Fajr: 'Фаджр',
  Dhuhr: 'Зухр',
  Asr: 'Аср',
  Maghrib: 'Магриб',
  Isha: 'Иша',
}

export function formatReminderMessage({ prayer, time, city, minutes = 15 }) {
  const name = PRAYER_LABELS[prayer] || prayer
  const place = city ? `\n📍 ${city}` : ''
  return [
    '🌙 <b>Напоминание о намазе</b>',
    '',
    `До намаза <b>${name}</b> осталось около <b>${minutes} минут</b>.`,
    `🕒 Время: <b>${time}</b>${place}`,
    '',
    'Приготовься со спокойным сердцем.',
    '«Воистину, намаз предписан верующим в определённое время.» (4:103)',
    '',
    '🤲 TILAWIN',
  ].join('\n')
}

export function handleUpdate(bot, update, { webAppUrl = WEBAPP_FALLBACK } = {}) {
  if (!bot) return Promise.resolve(null)
  const message = update?.message
  if (!message?.text) return Promise.resolve(null)

  const text = message.text.trim()
  const chatId = message.chat.id
  const firstName = message.from?.first_name || ''
  const keyboard = { reply_markup: linksKeyboard(webAppUrl) }

  if (text === '/start' || text.startsWith('/start ')) {
    return bot.sendMessage(chatId, startText(firstName), keyboard)
  }

  if (text === '/help') {
    return bot.sendMessage(
      chatId,
      [
        '<b>Справка TILAWIN</b>',
        '',
        '/start — приветствие и ссылки',
        '/namaz — открыть намаз в хабе',
        '/links — каналы и соцсети',
        '/help — эта справка',
        '',
        'Напоминания включаются во вкладке «Намаз» внутри Mini App.',
      ].join('\n'),
      keyboard,
    )
  }

  if (text === '/namaz' || text === '/prayer') {
    return bot.sendMessage(chatId, 'Открой вкладку <b>Намаз</b> в хабе — там расписание и напоминания за 15 минут.', {
      reply_markup: {
        inline_keyboard: [[{ text: '🕊 Открыть намаз', web_app: { url: webAppUrl } }]],
      },
    })
  }

  if (text === '/links') {
    return bot.sendMessage(chatId, 'Наши ссылки:', keyboard)
  }

  return Promise.resolve(null)
}
