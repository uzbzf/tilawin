import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { site } from '../data/site'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'
import { TelegramIcon } from './BrandIcons'
import { VideoModal } from './VideoModal'

const tones = {
  gold: 'from-[#2a241c] via-[#14110e] to-[#0a0908]',
  emerald: 'from-[#1c2420] via-[#101412] to-[#080a09]',
  sand: 'from-[#26221c] via-[#141210] to-[#0a0908]',
  dusk: 'from-[#1c1c22] via-[#101014] to-[#08080a]',
}

export function VideoGallery() {
  const { t } = useLocale()
  const { click, hover } = useSound()
  const [active, setActive] = useState(null)
  const videos = site.videos
  const lockRef = useRef(false)

  const open = (index) => {
    if (lockRef.current) return
    click()
    setActive(index)
  }

  const close = () => {
    lockRef.current = true
    setActive(null)
    window.setTimeout(() => {
      lockRef.current = false
    }, 400)
  }

  return (
    <section aria-label={t('gallery.title')}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-2xl text-[var(--text)]">{t('gallery.title')}</h2>
        <a
          href="https://t.me/tilawin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--muted)] no-underline hover:text-gold"
        >
          {t('gallery.source')}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {videos.map((video, index) => (
          <motion.button
            key={video.id}
            type="button"
            onMouseEnter={hover}
            onClick={() => open(index)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 * index }}
            className="glass group relative aspect-[3/4] overflow-hidden rounded-2xl text-left"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-b ${tones[video.tone] || tones.gold} transition duration-500 group-hover:scale-105`}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--glow),transparent_45%)] opacity-80" />
            <div className="relative flex h-full flex-col items-center justify-center gap-3 p-3">
              <p className="font-display text-3xl text-white" dir="rtl">
                {video.arabic}
              </p>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition group-hover:scale-110 group-hover:border-white/50">
                <TelegramIcon size={18} />
              </span>
              <p className="text-center text-[11px] text-white/80">{video.title}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <VideoModal
        videos={videos}
        index={active}
        onClose={close}
        onPrev={() => setActive((i) => (i == null ? 0 : (i + videos.length - 1) % videos.length))}
        onNext={() => setActive((i) => (i == null ? 0 : (i + 1) % videos.length))}
      />
    </section>
  )
}
