import { RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSound } from '../hooks/useSound'
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

export function Tasbeeh() {
  const { lang, t } = useLocale()
  const { click, tasbeeh } = useSound()
  const [index, setIndex] = useState(() => readState().index)
  const [count, setCount] = useState(() => readState().count)
  const [flash, setFlash] = useState(0)
  const dhikr = dhikrs[index]

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ index, count }))
    } catch {
      /* ignore */
    }
  }, [index, count])

  const tap = () => {
    tasbeeh()
    setFlash((n) => n + 1)
    setCount((n) => {
      const next = n + 1
      if (next >= dhikr.target) {
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

  return (
    <section className="glass rounded-3xl p-5" aria-label={t('tasbeeh.title')}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          {t('tasbeeh.title')}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
        >
          <RotateCcw size={12} />
          {t('tasbeeh.reset')}
        </button>
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
            className={`flex-1 rounded-full px-2 py-1.5 text-[10px] font-medium transition ${
              i === index ? 'bg-gold/20 text-[var(--text)]' : 'bg-white/5 text-[var(--muted)]'
            }`}
          >
            {item[lang]}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <p className="font-display text-xl text-[var(--text)]" dir="rtl">
          {dhikr.ar}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">{dhikr[lang]}</p>

        <button
          type="button"
          onClick={tap}
          className="relative mt-5 flex h-28 w-28 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/5 backdrop-blur-xl"
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
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="font-display text-4xl text-[var(--text)] tabular-nums"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </button>
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          {count} {t('tasbeeh.of')} {dhikr.target}
        </p>
      </div>
    </section>
  )
}
