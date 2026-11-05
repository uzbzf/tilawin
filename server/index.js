import { readFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBot, formatReminderMessage, handleUpdate } from './bot.js'
import { startReminderCron } from './reminders.js'
import { upsertReminder } from './store.js'

function loadEnvFile() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env')
  if (!existsSync(envPath)) return
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile()

const PORT = Number(process.env.PORT || 8787)
const BOT_TOKEN = process.env.BOT_TOKEN || ''
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://tilawin.vercel.app'
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

const bot = createBot(BOT_TOKEN)

if (!BOT_TOKEN) {
  console.warn('[tilawin-server] BOT_TOKEN missing — webhook replies and prayer pushes are disabled.')
} else {
  console.log('[tilawin-server] Telegram bot ready')
}

startReminderCron(bot, { intervalMs: 60_000 })

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  res.end(payload)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function fetchNextPrayer(lat, lng) {
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
      return { name, time: timings[name] }
    }
  }
  return { name: 'Fajr', time: timings.Fajr }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      bot: Boolean(BOT_TOKEN),
      webAppUrl: WEBAPP_URL,
    })
    return
  }

  if (req.method === 'POST' && url.pathname === '/telegram/webhook') {
    const update = await readBody(req)
    try {
      await handleUpdate(bot, update, { webAppUrl: WEBAPP_URL })
      sendJson(res, 200, { ok: true })
    } catch (error) {
      console.error('[webhook]', error.message)
      sendJson(res, 200, { ok: false })
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/notify') {
    const body = await readBody(req)
    if (!bot || !body.userId || !body.prayer || !body.time) {
      sendJson(res, 400, { ok: false, error: 'userId, prayer, time required' })
      return
    }
    try {
      await bot.sendMessage(
        body.userId,
        formatReminderMessage({
          prayer: body.prayer,
          time: body.time,
          city: body.city || '',
          minutes: Number(body.minutes) || 15,
        }),
      )
      sendJson(res, 200, { ok: true })
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message, code: error.code })
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/reminders') {
    const body = await readBody(req)
    const userId = body.userId || body.telegramId
    if (!userId) {
      sendJson(res, 400, { ok: false, error: 'userId required' })
      return
    }

    try {
      const offsetMinutes = Number.isFinite(Number(body.offsetMinutes)) ? Number(body.offsetMinutes) : 0
      const fridayKahf = Boolean(body.fridayKahf)
      const saved = await upsertReminder(userId, {
        enabled: Boolean(body.enabled),
        lat: Number(body.lat),
        lng: Number(body.lng),
        city: body.city || '',
        offsetMinutes,
        fridayKahf,
        initData: body.initData || '',
      })

      let next = null
      let delivered = false
      let needStart = false

      if (body.enabled) {
        try {
          next = await fetchNextPrayer(Number(body.lat), Number(body.lng))
        } catch {
          /* ignore */
        }

        if (bot) {
          const when =
            offsetMinutes > 0
              ? `Я буду мягко напоминать за <b>${offsetMinutes} минут</b> до каждого намаза.`
              : 'Я буду уведомлять, когда <b>наступит время намаза</b>.'
          const text = [
            '✅ <b>Напоминания включены</b>',
            '',
            when,
            fridayKahf ? '📖 По пятницам — напоминание прочесть суру <b>Аль-Кахф</b>.' : '',
            next ? `Следующий: <b>${next.name}</b> · <b>${next.time}</b>${body.city ? ` · ${body.city}` : ''}` : '',
            '',
            'Важно: хотя бы раз нажми /start у бота, чтобы сообщения доходили.',
          ]
            .filter(Boolean)
            .join('\n')

          try {
            await bot.sendMessage(userId, text)
            delivered = true
          } catch (error) {
            needStart = error?.code === 403 || /blocked|chat not found|initiate/i.test(error.message || '')
          }
        }
      } else if (bot) {
        await bot
          .sendMessage(userId, '🔕 Напоминания о намазе выключены.\nКогда захочешь — включи снова в Mini App.')
          .catch(() => {})
      }

      sendJson(res, 200, {
        ok: true,
        reminder: saved,
        delivered,
        needStart,
        nextPrayer: next,
        offlineBot: !bot,
      })
    } catch (error) {
      console.error('[reminders api]', error.message)
      sendJson(res, 500, { ok: false, error: error.message })
    }
    return
  }

  sendJson(res, 404, { ok: false, error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`[tilawin-server] listening on http://localhost:${PORT}`)
})
