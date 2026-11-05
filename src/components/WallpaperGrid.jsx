import { Download, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { wallpapers } from '../data/wallpapers'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'
import { isTelegramWebApp } from '../lib/telegram'

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(' ')
  let line = ''
  let cursorY = y
  for (let n = 0; n < words.length; n += 1) {
    const test = `${line}${words[n]} `
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, cursorY)
      line = `${words[n]} `
      cursorY += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, cursorY)
  return cursorY
}

async function renderWallpaperBlob(item, caption) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#1a1510')
  gradient.addColorStop(0.45, '#0c0a08')
  gradient.addColorStop(1, '#050504')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const glow = ctx.createRadialGradient(540, 760, 40, 540, 760, 460)
  glow.addColorStop(0, item.accent || 'rgba(232,200,140,0.35)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#f4f4f5'
  ctx.textAlign = 'center'
  ctx.font = '68px Georgia, "Noto Naskh Arabic", serif'
  wrapText(ctx, item.arabic, 540, 820, 860, 86)

  ctx.fillStyle = 'rgba(244,244,245,0.78)'
  ctx.font = '30px Outfit, sans-serif'
  wrapText(ctx, caption, 540, 1040, 820, 40)

  ctx.fillStyle = 'rgba(244,244,245,0.42)'
  ctx.font = '24px Outfit, sans-serif'
  ctx.fillText('TILAWIN', 540, 1760)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('blob'))), 'image/png')
  })
  return blob
}

async function saveWallpaper(item, caption) {
  const blob = await renderWallpaperBlob(item, caption)
  const fileName = `tilawin-${item.id}.png`
  const file = new File([blob], fileName, { type: 'image/png' })

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'TILAWIN', text: caption })
      return 'shared'
    }
  } catch (error) {
    if (error?.name === 'AbortError') return 'cancelled'
  }

  const url = URL.createObjectURL(blob)

  // Desktop / browser: classic download
  if (!isTelegramWebApp()) {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    return 'downloaded'
  }

  // Telegram WebView: open preview so user can long-press → Save
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) {
      // Fallback: navigate current webview — user can still long-press
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
  } catch {
    /* ignore */
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return 'telegram'
}

export function WallpaperGrid() {
  const { lang, t } = useLocale()
  const { click, hover } = useSound()
  const [status, setStatus] = useState('')
  const inTg = isTelegramWebApp()

  return (
    <section aria-label={t('wallpapers.title')}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-2xl text-[var(--text)]">{t('wallpapers.title')}</h2>
        <p className="max-w-[45%] shrink-0 text-right text-[11px] leading-snug break-words text-[var(--muted)]">
          {t('wallpapers.hint')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {wallpapers.map((item, index) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onMouseEnter={hover}
            className="glass group relative aspect-[9/16] overflow-hidden rounded-2xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${item.tone}`} />
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${item.accent}, transparent 55%)`,
              }}
            />
            <div className="relative flex h-full flex-col items-center justify-between gap-3 overflow-hidden p-3 pt-7 pb-3 text-center">
              <p
                className="line-clamp-3 max-w-full px-1 font-display text-[1.35rem] leading-snug break-words text-white"
                dir="rtl"
              >
                {item.arabic}
              </p>
              <div className="w-full space-y-2">
                <p className="line-clamp-2 text-[11px] leading-snug break-words text-white/75">
                  {item.caption[lang]}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    click()
                    setStatus('')
                    try {
                      const mode = await saveWallpaper(item, item.caption[lang])
                      if (mode === 'cancelled') return
                      if (mode === 'shared') setStatus(t('wallpapers.shared'))
                      else if (mode === 'telegram') setStatus(t('wallpapers.telegramSave'))
                      else setStatus(t('wallpapers.saved'))
                    } catch {
                      setStatus(t('wallpapers.error'))
                    }
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white backdrop-blur-md transition group-hover:border-white/40"
                >
                  {inTg ? <Share2 size={13} /> : <Download size={13} />}
                  {t('wallpapers.download')}
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
      {status && (
        <p className="mt-2 px-1 text-center text-[11px] leading-snug break-words text-[var(--muted)]">{status}</p>
      )}
    </section>
  )
}
