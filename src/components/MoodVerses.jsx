import { Check, Copy, Heart, Search, Share2, Sparkles, Sunrise, Wind } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { pickRandomVerse, searchVerses } from '../data/verses'
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
  const [mood, setMood] = useState(null)
  const [verse, setVerse] = useState(null)
  const [flipKey, setFlipKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => (query.trim() ? searchVerses(query, lang) : []), [query, lang])

  const shareText = verse
    ? `${verse.arabic}\n${verse.text[lang]}\n— ${verse.surah[lang]} ${verse.ref}\n(${verse.translator || 'Эльмир Кулиев'})`
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
      /* cancelled */
    }
    copy()
  }

  const showVerse = (nextVerse, nextMood = mood) => {
    if (!nextVerse) return
    flip()
    setMood(nextMood)
    setVerse(nextVerse)
    setFlipKey((n) => n + 1)
  }

  const selectMood = (moodId) => {
    const next = pickRandomVerse(moodId, verse?.id)
    showVerse(next, moodId)
  }

  return (
    <section className="glass overflow-hidden rounded-3xl p-5" aria-label={t('mood.title')}>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
        {t('mood.title')}
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--muted)]">{t('mood.hint')}</p>

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
                  showVerse(item, mood)
                  setQuery('')
                }}
                className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-white/10"
              >
                <span className="text-xs text-[var(--muted)]">
                  {item.surah[lang]} · {item.ref}
                </span>
                <span className="line-clamp-2 text-sm text-[var(--text)]">{item.text[lang]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {moods.map((item) => {
          const Icon = item.icon
          const selected = mood === item.id
          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={hover}
              onClick={() => selectMood(item.id)}
              className={`flex min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl border px-3 py-3 text-left transition ${
                selected
                  ? 'border-gold/40 bg-gold/15 ring-1 ring-gold/20'
                  : 'border-[var(--glass-border)] bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Icon size={16} strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[var(--text)]">
                  {t(`mood.moods.${item.id}.label`)}
                </span>
                <span className="block truncate text-[11px] text-[var(--muted)]">
                  {t(`mood.moods.${item.id}.sub`)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative mt-4 min-h-[190px] overflow-hidden">
        <AnimatePresence mode="wait">
          {verse ? (
            <motion.div
              key={flipKey}
              initial={{ opacity: 0, rotateX: -28, y: 18, scale: 0.96, filter: 'blur(10px)' }}
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, rotateX: 18, y: -12, scale: 0.98, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.65 }}
              style={{ transformPerspective: 900, transformOrigin: 'center top' }}
              className="overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl"
            >
              <p
                className="font-display text-[1.55rem] leading-relaxed break-words text-[var(--text)] sm:text-2xl"
                dir="rtl"
              >
                {verse.arabic}
              </p>
              <p className="mt-3 text-sm leading-relaxed break-words text-[var(--muted)]">{verse.text[lang]}</p>
              <p className="mt-2 text-[11px] tracking-wide break-words text-[var(--muted)]">
                {verse.surah[lang]} · {verse.ref}
                {lang === 'ru' ? ` · ${verse.translator || 'Эльмир Кулиев'}` : ''}
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
                {mood && (
                  <button
                    type="button"
                    onClick={() => selectMood(mood)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)]"
                  >
                    {t('mood.another')}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-[var(--glass-border)] px-4 text-center text-sm text-[var(--muted)]"
            >
              {t('mood.hint')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
