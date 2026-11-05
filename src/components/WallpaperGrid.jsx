import { Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { wallpapers } from '../data/wallpapers'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

function downloadWallpaper(item, caption) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#1a1510')
  gradient.addColorStop(0.45, '#0c0a08')
  gradient.addColorStop(1, '#050504')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const glow = ctx.createRadialGradient(540, 720, 40, 540, 720, 420)
  glow.addColorStop(0, item.accent || 'rgba(232,200,140,0.35)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#f4f4f5'
  ctx.textAlign = 'center'
  ctx.font = '72px Georgia, serif'
  ctx.fillText(item.arabic, 540, 900)

  ctx.fillStyle = 'rgba(244,244,245,0.72)'
  ctx.font = '28px Outfit, sans-serif'
  ctx.fillText(caption, 540, 1000)

  ctx.fillStyle = 'rgba(244,244,245,0.4)'
  ctx.font = '22px Outfit, sans-serif'
  ctx.fillText('TILAWIN', 540, 1750)

  const link = document.createElement('a')
  link.download = `tilawin-${item.id}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function WallpaperGrid() {
  const { lang, t } = useLocale()
  const { click, hover } = useSound()

  return (
    <section aria-label={t('wallpapers.title')}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-2xl text-[var(--text)]">{t('wallpapers.title')}</h2>
        <p className="text-[11px] text-[var(--muted)]">{t('wallpapers.hint')}</p>
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
            <div className="relative flex h-full flex-col items-center justify-between p-3 pt-8 pb-3 text-center">
              <p className="font-display text-2xl leading-relaxed text-white" dir="rtl">
                {item.arabic}
              </p>
              <div className="w-full space-y-2">
                <p className="text-[11px] text-white/75">{item.caption[lang]}</p>
                <button
                  type="button"
                  onClick={() => {
                    click()
                    downloadWallpaper(item, item.caption[lang])
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white backdrop-blur-md transition group-hover:border-white/40"
                >
                  <Download size={13} />
                  {t('wallpapers.download')}
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
