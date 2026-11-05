import { readFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBot, handleUpdate } from './bot.js'
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

  if (req.method === 'POST' && url.pathname === '/api/reminders') {
    const body = await readBody(req)
    const userId = body.userId || body.telegramId
    if (!userId) {
      sendJson(res, 400, { ok: false, error: 'userId required' })
      return
    }

    try {
      const saved = await upsertReminder(userId, {
        enabled: Boolean(body.enabled),
        lat: Number(body.lat),
        lng: Number(body.lng),
        city: body.city || '',
        offsetMinutes: Number(body.offsetMinutes) || 15,
        initData: body.initData || '',
      })

      if (bot && body.enabled) {
        await bot
          .sendMessage(
            userId,
            `Напоминания о намазе включены (за ${Number(body.offsetMinutes) || 15} мин)${body.city ? ` · ${body.city}` : ''}.`,
          )
          .catch(() => {})
      }

      sendJson(res, 200, { ok: true, reminder: saved, offlineBot: !bot })
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
