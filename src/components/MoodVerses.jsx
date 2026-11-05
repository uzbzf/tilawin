import { Check, Copy, Heart, Search, Share2, Sparkles, Sunrise, Wind } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { searchVerses, verses } from '../data/verses'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

const moods = [
  { id: 'calm', icon: Wind },
  { id: 'hope', icon: Sunrise },
  { id: 'gratitude', icon: Heart },
  { id: 'inspire', icon: Sparkles },
]

export function MoodVerses({ showSearch = false }) {
  const { lang, t } = useLocale()
  const { click, flip, hover } = useSound()
  const [active, setActive] = useState(null)
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => (query.trim() ? searchVerses(query, lang) : []), [query, lang])
  const verse = active ? verses[active] : null

  const shareText = verse
    ? `${verse.arabic}\n${verse.text[lang]}\n— ${verse.surah[lang]} ${verse.ref}`
    : ''

  const copy = async () => {
    click()
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const share = async () => {
    click()
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText })
        return
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const selectVerse = (id) => {
    flip()
    setActive(id)
  }

  return (
    <section className="glass rounded-3xl p-5" aria-label={t('mood.title')}>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
        {t('mood.title')}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{t('mood.hint')}</p>

      {showSearch && (
        <label className="relative mt-4 block">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('mood.search')}
            className="w-full rounded-2xl border border-[var(--glass-border)] bg-white/5 py-2.5 pr-3 pl-9 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-gold/40"
          />
        </label>
      )}

      {showSearch && results.length > 0 && (
        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-black/10 p-1.5">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  click()
                  selectVerse(item.id)
                  setQuery('')
                }}
                className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-white/10"
              >
                <span className="text-xs text-[var(--muted)]">
                  {item.surah[lang]} · {item.ref}
                </span>
                <span className="truncate text-sm text-[var(--text)]">{item.text[lang]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {moods.map((mood) => {
          const Icon = mood.icon
          const selected = active === mood.id
          return (
            <button
              key={mood.id}
              type="button"
              onMouseEnter={hover}
              onClick={() => selectVerse(mood.id)}
              className={`flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition ${
                selected
                  ? 'border-gold/40 bg-gold/15 ring-1 ring-gold/20'
                  : 'border-[var(--glass-border)] bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Icon size={16} strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[var(--text)]">
                  {t(`mood.moods.${mood.id}.label`)}
                </span>
                <span className="block text-[11px] text-[var(--muted)]">
                  {t(`mood.moods.${mood.id}.sub`)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative mt-4 min-h-[168px]" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          {verse ? (
            <motion.div
              key={active}
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4 backdrop-blur-xl"
            >
              <p className="font-display text-2xl leading-relaxed text-[var(--text)]" dir="rtl">
                {verse.arabic}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{verse.text[lang]}</p>
              <p className="mt-2 text-[11px] tracking-wide text-[var(--muted)]">
                {verse.surah[lang]} · {verse.ref}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-xs text-[var(--text)]"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? t('mood.copied') : t('mood.copy')}
                </button>
                <button
                  type="button"
                  onClick={share}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)]"
                >
                  <Share2 size={13} />
                  {t('mood.share')}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[168px] items-center justify-center rounded-2xl border border-dashed border-[var(--glass-border)] px-4 text-center text-sm text-[var(--muted)]"
            >
              {t('mood.hint')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
