import { Check, Copy, Share2, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { asmaUlHusna } from '../data/asmaUlHusna'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

function meaning(item, lang) {
  if (lang === 'en') return item.en
  if (lang === 'ar') return item.ar
  return item.ru
}

export function AsmaUlHusna() {
  const { t, lang } = useLocale()
  const { click, success } = useSound()
  const [active, setActive] = useState(null)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef(null)

  const shareText = useMemo(() => {
    if (!active) return ''
    return [
      active.ar,
      active.tr,
      meaning(active, lang),
      '',
      `${t('asma.title')} · ${active.n}/99`,
      'TILAWIN',
    ].join('\n')
  }, [active, lang, t])

  const copyName = async () => {
    click()
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      success()
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const shareName = async () => {
    click()
    try {
      if (navigator.share) {
        await navigator.share({ title: active.tr, text: shareText })
        success()
        return
      }
      await copyName()
    } catch {
      /* cancelled */
    }
  }

  return (
    <section className="glass overflow-hidden rounded-3xl p-4" aria-label={t('asma.title')}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl text-[var(--text)]">{t('asma.title')}</h3>
          <p className="text-[11px] text-[var(--muted)]">{t('asma.hint')}</p>
        </div>
      </div>

      <div className="grid max-h-[28rem] grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4">
        {asmaUlHusna.map((item) => (
          <button
            key={item.n}
            type="button"
            onClick={() => {
              click()
              setActive(item)
            }}
            className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-1.5 py-2.5 text-center transition hover:border-gold/35 hover:bg-gold/10"
          >
            <span className="block text-[9px] tabular-nums text-[var(--muted)]">{item.n}</span>
            <span className="mt-0.5 block font-quran text-lg leading-tight text-[var(--text)]" dir="rtl">
              {item.ar}
            </span>
            <span className="mt-0.5 block truncate text-[9px] text-[var(--muted)]">{item.tr}</span>
          </button>
        ))}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
                onClick={() => setActive(null)}
              >
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full max-w-md"
                >
                  <div
                    ref={cardRef}
                    className="relative overflow-hidden rounded-3xl p-6 text-center shadow-2xl"
                    style={{
                      background:
                        'linear-gradient(160deg, #1a2a1f 0%, #0d1410 45%, #1f1810 100%)',
                    }}
                  >
                    <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.35),transparent_70%)]" />
                    <button
                      type="button"
                      onClick={() => setActive(null)}
                      className="absolute top-3 right-3 rounded-full bg-white/10 p-1.5 text-white/80"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-[11px] tracking-[0.2em] text-[#c9a84c]/80">
                      {active.n} / 99
                    </p>
                    <p className="mt-3 font-quran text-4xl text-[#f7f1e2]" dir="rtl">
                      {active.ar}
                    </p>
                    <p className="mt-2 font-display text-xl text-[#c9a84c]">{active.tr}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/75">{meaning(active, lang)}</p>
                    <p className="mt-5 text-[10px] tracking-widest text-white/40">TILAWIN</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={copyName}
                      className="glass-strong inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-xs"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? t('prayer.copied') : t('asma.copy')}
                    </button>
                    <button
                      type="button"
                      onClick={shareName}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gold/25 px-3 py-3 text-xs text-[var(--text)]"
                    >
                      <Share2 size={14} />
                      {t('asma.share')}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  )
}
