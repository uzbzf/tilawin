import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'
import { TelegramIcon } from './BrandIcons'

export function VideoModal({ videos, index, onClose, onPrev, onNext }) {
  const { t } = useLocale()
  const { click } = useSound()
  const video = index == null ? null : videos[index]

  useEffect(() => {
    if (index == null) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onPrev()
      if (event.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, onClose, onPrev, onNext])

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            aria-label={t('close')}
            onClick={(event) => {
              event.stopPropagation()
              click()
              onClose()
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={video.title}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="glass relative z-10 w-full max-w-md overflow-hidden rounded-3xl"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                click()
                onClose()
              }}
              className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md"
              aria-label={t('close')}
            >
              <X size={16} />
            </button>

            <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,var(--glow),transparent_55%)] p-6 text-center">
                <p className="font-display text-5xl text-[var(--text)]" dir="rtl">
                  {video.arabic}
                </p>
                <p className="text-[var(--muted)]">{video.title}</p>
                <a
                  href={video.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onPointerDown={(event) => {
                    if (event.button === 0) click()
                  }}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold/20 px-5 py-2.5 text-sm text-[var(--text)] transition hover:bg-gold/30"
                >
                  <TelegramIcon size={16} />
                  {t('gallery.open')}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  click()
                  onPrev()
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[var(--text)]"
                aria-label={t('prev')}
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-sm text-[var(--text)]">{video.title}</p>
              <button
                type="button"
                onClick={() => {
                  click()
                  onNext()
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[var(--text)]"
                aria-label={t('next')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
