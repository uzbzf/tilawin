import { tg } from '../_telegram.js'

const WEBAPP = process.env.WEBAPP_URL || 'https://tilawin.vercel.app'

function startText(name) {
  const who = name ? `, <b>${name}</b>` : ''
  return [
    `السلام عليكم${who}!`,
    '',
    'Добро пожаловать в <b>TILAWIN Hub</b> — спокойный помощник для намаза, Корана и зикра.',
    '',
    '✨ Что умеет хаб:',
    '• времена намаза, Тахаджуд и методы расчёта',
    '• уведомления, когда наступило время намаза',
    '• пятничное напоминание суры Аль-Кахф',
    '• Мединский мусхаф, чтецы и полный список сур',
    '• компас Киблы и 99 имён Аллаха',
    '• тасбих, азкары, аяты и каллиграфия',
    '',
    'Нажми кнопку ниже, чтобы открыть Mini App.',
  ].join('\n')
}

function linksKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🕊 Открыть TILAWIN Hub', web_app: { url: WEBAPP } }],
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }

  const update = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const message = update.message
  const text = message?.text?.trim() || ''
  const chatId = message?.chat?.id
  const firstName = message?.from?.first_name || ''

  try {
    if (chatId && (text === '/start' || text.startsWith('/start '))) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: startText(firstName),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: linksKeyboard(),
      })
    } else if (chatId && text === '/help') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: [
          '<b>Справка TILAWIN</b>',
          '',
          '/start — приветствие и ссылки',
          '/namaz — открыть намаз в хабе',
          '/help — эта справка',
          '',
          'Напоминания и методы расчёта — во вкладке «Настройки» внутри Mini App.',
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: linksKeyboard(),
      })
    } else if (chatId && (text === '/namaz' || text === '/prayer')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Открой вкладку <b>Намаз</b> в хабе — расписание, Кибла и Тахаджуд. Напоминания включаются в <b>Настройках</b>.',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🕊 Открыть намаз', web_app: { url: WEBAPP } }]],
        },
      })
    } else if (chatId && text === '/links') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Наши ссылки:',
        reply_markup: linksKeyboard(),
      })
    } else if (chatId && (text === '/dua' || text === '/duaa')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: [
          '🤲 <b>Короткая дуа</b>',
          '',
          '«Рабби, расширь мне грудь, облегчи мне дело.»',
          '<i>(Та Ха 20:25–26, смысл)</i>',
          '',
          'Открой хаб → вкладка Аяты, чтобы получить аят под настроение.',
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: linksKeyboard(),
      })
    }
  } catch (error) {
    console.error('[webhook]', error.message)
  }

  res.status(200).json({ ok: true })
}
