import { Download, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { wallpapers } from '../data/wallpapers'
import { getWallpaperTheme, wallpaperThemes } from '../data/wallpaperThemes'
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

function drawParticles(ctx, theme, width, height) {
  const count = theme.particles === 'stars' ? 90 : 55
  for (let i = 0; i < count; i += 1) {
    const x = ((i * 97) % width) + (i % 7) * 3
    const y = ((i * 53) % height) + (i % 5) * 5
    const size = 0.8 + (i % 4) * 0.7
    ctx.fillStyle = theme.particleColor

    if (theme.particles === 'stars') {
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      if (i % 7 === 0) {
        ctx.strokeStyle = theme.particleColor
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.moveTo(x - size * 3, y)
        ctx.lineTo(x + size * 3, y)
        ctx.moveTo(x, y - size * 3)
        ctx.lineTo(x, y + size * 3)
        ctx.stroke()
      }
    } else if (theme.particles === 'bubbles') {
      ctx.globalAlpha = 0.35 + (i % 5) * 0.08
      ctx.beginPath()
      ctx.arc(x, y, size * 2.2, 0, Math.PI * 2)
      ctx.strokeStyle = theme.particleColor
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
    } else if (theme.particles === 'embers') {
      ctx.globalAlpha = 0.5 + (i % 4) * 0.1
      ctx.beginPath()
      ctx.ellipse(x, y, size * 0.7, size * 1.8, -0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    } else if (theme.particles === 'leaves') {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(((i % 10) - 5) * 0.2)
      ctx.beginPath()
      ctx.ellipse(0, 0, size * 1.4, size * 2.4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else if (theme.particles === 'sparkles') {
      ctx.beginPath()
      ctx.moveTo(x, y - size * 2)
      ctx.lineTo(x + size * 0.6, y)
      ctx.lineTo(x, y + size * 2)
      ctx.lineTo(x - size * 0.6, y)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.globalAlpha = 0.4 + (i % 5) * 0.1
      ctx.beginPath()
      ctx.arc(x, y, size * 0.9, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }
}

async function waitFonts() {
  try {
    if (document.fonts?.load) {
      await document.fonts.load('72px "UthmanicHafs"')
      await document.fonts.load('72px "Amiri Quran"')
    }
  } catch {
    /* ignore */
  }
}

async function renderWallpaperBlob(item, caption, theme) {
  await waitFonts()
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, theme.stops[0])
  gradient.addColorStop(0.45, theme.stops[1])
  gradient.addColorStop(1, theme.stops[2])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawParticles(ctx, theme, canvas.width, canvas.height)

  const glow = ctx.createRadialGradient(540, 760, 40, 540, 760, 460)
  glow.addColorStop(0, theme.accent)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.font = '72px "UthmanicHafs", "Amiri Quran", "Noto Naskh Arabic", serif'
  wrapText(ctx, item.arabic, 540, 820, 860, 92)

  ctx.fillStyle = theme.muted
  ctx.font = '30px Outfit, sans-serif'
  wrapText(ctx, caption, 540, 1060, 820, 40)

  ctx.fillStyle = theme.muted
  ctx.globalAlpha = 0.55
  ctx.font = '24px Outfit, sans-serif'
  ctx.fillText('TILAWIN', 540, 1760)
  ctx.globalAlpha = 1

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('blob'))), 'image/png')
  })
  return blob
}

async function saveWallpaper(item, caption, theme) {
  const blob = await renderWallpaperBlob(item, caption, theme)
  const fileName = `tilawin-${item.id}-${theme.id}.png`
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

  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) {
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

function PreviewParticles({ theme }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 19) % 100}%`,
        delay: (i % 6) * 0.35,
        size: 1 + (i % 3),
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((dot) => (
        <motion.span
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: dot.left,
            top: dot.top,
            width: theme.particles === 'bubbles' ? dot.size + 2 : dot.size,
            height: theme.particles === 'embers' ? dot.size * 2.5 : dot.size,
            background: theme.particleColor,
            boxShadow: theme.particles === 'stars' ? `0 0 6px ${theme.particleColor}` : 'none',
          }}
          animate={{ opacity: [0.15, 0.85, 0.2], scale: [0.8, 1.25, 0.85], y: theme.particles === 'embers' ? [0, -8, 0] : [0, 0, 0] }}
          transition={{ duration: 2.4 + (dot.id % 4) * 0.3, repeat: Infinity, delay: dot.delay }}
        />
      ))}
    </div>
  )
}

export function WallpaperGrid() {
  const { lang, t, labelFor } = useLocale()
  const { click, hover } = useSound()
  const [status, setStatus] = useState('')
  const [themeId, setThemeId] = useState('night')
  const theme = getWallpaperTheme(themeId)
  const inTg = isTelegramWebApp()

  return (
    <section aria-label={t('wallpapers.title')}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-2xl text-[var(--text)]">{t('wallpapers.title')}</h2>
        <p className="max-w-[45%] shrink-0 text-right text-[11px] leading-snug break-words text-[var(--muted)]">
          {t('wallpapers.hint')}
        </p>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {wallpaperThemes.map((item) => {
          const selected = item.id === themeId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                click()
                setThemeId(item.id)
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition ${
                selected
                  ? 'bg-gold/25 text-[var(--text)] ring-1 ring-gold/35'
                  : 'bg-white/5 text-[var(--muted)]'
              }`}
            >
              {labelFor(item.label)}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {wallpapers.map((item, index) => (
          <motion.article
            key={`${item.id}-${theme.id}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onMouseEnter={hover}
            className="glass group relative aspect-[9/16] overflow-hidden rounded-2xl"
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${theme.stops[0]}, ${theme.stops[1]}, ${theme.stops[2]})`,
              }}
            />
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${theme.accent}, transparent 55%)`,
              }}
            />
            <PreviewParticles theme={theme} />
            <div className="relative flex h-full flex-col items-center justify-between gap-3 overflow-hidden p-3 pt-7 pb-3 text-center">
              <p
                className="font-quran line-clamp-3 max-w-full px-1 text-[1.45rem] leading-snug break-words text-white"
                dir="rtl"
              >
                {item.arabic}
              </p>
              <div className="w-full space-y-2">
                <p className="line-clamp-2 text-[11px] leading-snug break-words text-white/75">
                  {item.caption[lang] || item.caption.ru || item.caption.en}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    click()
                    setStatus('')
                    try {
                      const mode = await saveWallpaper(
                        item,
                        item.caption[lang] || item.caption.ru || item.caption.en,
                        theme,
                      )
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
