export async function tg(method, body) {
  const token = process.env.BOT_TOKEN
  if (!token) throw new Error('BOT_TOKEN missing')
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!data.ok) {
    const err = new Error(data.description || `Telegram ${method} failed`)
    err.code = data.error_code
    throw err
  }
  return data.result
}

export const PRAYER_LABELS = {
  Fajr: 'Фаджр',
  Dhuhr: 'Зухр',
  Asr: 'Аср',
  Maghrib: 'Магриб',
  Isha: 'Иша',
}

export function formatReminderMessage({ prayer, time, city, minutes = 0 }) {
  const name = PRAYER_LABELS[prayer] || prayer
  const place = city ? `\n📍 ${city}` : ''
  const lead =
    Number(minutes) > 0
      ? `До намаза <b>${name}</b> осталось около <b>${minutes} минут</b>.`
      : `Наступило время намаза <b>${name}</b>.`
  return [
    '🌙 <b>Напоминание о намазе</b>',
    '',
    lead,
    `🕒 Время: <b>${time}</b>${place}`,
    '',
    'Приготовься со спокойным сердцем.',
    '«Воистину, намаз предписан верующим в определённое время.» (4:103)',
    '',
    '🤲 TILAWIN',
  ].join('\n')
}

export function formatEnabledMessage({ nextName, nextTime, city, minutes = 0, fridayKahf = false }) {
  const name = PRAYER_LABELS[nextName] || nextName || '—'
  const when =
    Number(minutes) > 0
      ? `Я буду мягко напоминать за <b>${minutes} минут</b> до каждого намаза.`
      : 'Я буду уведомлять, когда <b>наступит время намаза</b>.'
  return [
    '✅ <b>Напоминания включены</b>',
    '',
    when,
    fridayKahf ? '📖 По пятницам — напоминание прочесть суру <b>Аль-Кахф</b>.' : '',
    nextTime ? `Следующий: <b>${name}</b> · <b>${nextTime}</b>${city ? ` · ${city}` : ''}` : '',
    '',
    'Важно: хотя бы раз нажми /start у бота, чтобы сообщения доходили.',
    '',
    'Открывай хаб: мусхаф, Кибла, 99 имён, Тахаджуд и тасбих.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatFridayKahfMessage() {
  return [
    '📖 <b>Пятница · сура Аль-Кахф</b>',
    '',
    'Сегодня пятница. Пророк ﷺ рекомендовал читать суру <b>Аль-Кахф</b> в этот день.',
    '',
    'Открой хаб → Коран → сура 18.',
    '',
    '🤲 TILAWIN',
  ].join('\n')
}

export async function fetchNextPrayer(lat, lng) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=3&school=1`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  const timings = data?.data?.timings
  if (!timings) return null

  const order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
  const now = new Date()
  for (const name of order) {
    const [h, m] = String(timings[name]).split(':').map(Number)
    const at = new Date(now)
    at.setHours(h, m, 0, 0)
    if (at.getTime() > now.getTime() + 60_000) {
      return { name, time: timings[name], at }
    }
  }
  return { name: 'Fajr', time: timings.Fajr, at: null }
}
