import { Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSound } from '../hooks/useSound'
import { useTelegram } from '../hooks/useTelegram'
import { useLocale } from '../i18n/LocaleContext'
import { dhikrs } from '../i18n/translations'

const KEY = 'tilawin-tasbeeh'

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (typeof saved.index === 'number' && typeof saved.count === 'number') return saved
  } catch {
    /* ignore */
  }
  return { index: 0, count: 0 }
}

function dhikrLabel(dhikr, lang) {
  return dhikr[lang] || dhikr.ru || dhikr.en || dhikr.ar
}

export function Tasbeeh() {
  const { lang, t } = useLocale()
  const { click, tasbeeh, success, chime } = useSound()
  const { haptic } = useTelegram()
  const [index, setIndex] = useState(() => readState().index)
  const [count, setCount] = useState(() => readState().count)
  const [flash, setFlash] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const dhikr = dhikrs[index]

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ index, count }))
    } catch {
      /* ignore */
    }
  }, [index, count])

  useEffect(() => {
    if (!fullscreen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const tap = () => {
    tasbeeh()
    haptic('soft')
    setFlash((n) => n + 1)
    setCount((n) => {
      const next = n + 1
      if (next >= dhikr.target) {
        success()
        chime()
        window.setTimeout(() => {
          setIndex((i) => (i + 1) % dhikrs.length)
          setCount(0)
        }, 280)
      }
      return next
    })
  }

  const reset = () => {
    click()
    setCount(0)
    setIndex(0)
  }

  const body = (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          {t('tasbeeh.title')}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              click()
              setFullscreen((v) => !v)
            }}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
          >
            {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {fullscreen ? t('tasbeeh.exitFullscreen') : t('tasbeeh.fullscreen')}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
          >
            <RotateCcw size={12} />
            {t('tasbeeh.reset')}
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5">
        {dhikrs.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              click()
              setIndex(i)
              setCount(0)
            }}
            className={`flex-1 truncate rounded-full px-2 py-1.5 text-[10px] font-medium transition ${
              i === index ? 'bg-gold/20 text-[var(--text)]' : 'bg-white/5 text-[var(--muted)]'
            }`}
          >
            {dhikrLabel(item, lang)}
          </button>
        ))}
      </div>

      <div className={`flex flex-col items-center ${fullscreen ? 'flex-1 justify-center' : ''}`}>
        <p className={`font-display text-[var(--text)] ${fullscreen ? 'text-3xl sm:text-4xl' : 'text-xl'}`} dir="rtl">
          {dhikr.ar}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">{dhikrLabel(dhikr, lang)}</p>

        <button
          type="button"
          onClick={tap}
          className={`relative mt-5 flex items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/5 backdrop-blur-xl ${
            fullscreen ? 'h-48 w-48 sm:h-56 sm:w-56' : 'h-28 w-28'
          }`}
        >
          <motion.span
            key={flash}
            initial={{ opacity: 0.55, scale: 0.7 }}
            animate={{ opacity: 0, scale: 1.35 }}
            transition={{ duration: 0.55 }}
            className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--glow),transparent_65%)]"
          />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={count}
              initial={{ y: 16, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -16, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className={`font-display text-[var(--text)] tabular-nums ${fullscreen ? 'text-6xl' : 'text-4xl'}`}
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </button>
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          {count} {t('tasbeeh.of')} {dhikr.target}
        </p>
      </div>
    </>
  )

  return (
    <>
      <section className="glass rounded-3xl p-5" aria-label={t('tasbeeh.title')}>
        {body}
      </section>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]/95 p-5 backdrop-blur-xl"
            style={{
              paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            }}
          >
            <div
              className="absolute inset-0 opacity-80"
              style={{ background: 'var(--skin-overlay)' }}
              aria-hidden
            />
            <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col">{body}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
