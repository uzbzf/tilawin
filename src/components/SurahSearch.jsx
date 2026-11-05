import { BookOpen, ExternalLink, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { searchSurahs } from '../data/surahs'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'
import { getWebApp } from '../lib/telegram'

export function SurahSearch() {
  const { t, lang } = useLocale()
  const { click, whoosh } = useSound()
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchSurahs(query), [query])

  const openSurah = (n) => {
    click()
    const url = `https://quran.com/${n}`
    try {
      getWebApp()?.openLink?.(url)
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const nameFor = (surah) => {
    if (lang === 'ar') return surah.ar
    if (lang === 'en') return surah.tr
    return surah.ru
  }

  const meaningFor = (surah) => {
    if (lang === 'ar') return surah.tr
    if (lang === 'en') return surah.en
    return surah.en
  }

  return (
    <section className="glass overflow-hidden rounded-3xl p-4" aria-label={t('surah.title')}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <BookOpen size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl text-[var(--text)]">{t('surah.title')}</h3>
          <p className="text-[11px] text-[var(--muted)]">{t('surah.hint')}</p>
        </div>
      </div>

      <label className="relative block">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!query) whoosh()
          }}
          placeholder={t('surah.search')}
          className="w-full rounded-2xl border border-[var(--glass-border)] bg-white/5 py-2.5 pr-3 pl-9 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-gold/40"
        />
      </label>

      <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {results.map((surah) => (
            <motion.li
              key={surah.n}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => openSurah(surah.n)}
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-[var(--glass-border)] hover:bg-white/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-xs font-semibold text-gold tabular-nums">
                  {surah.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-[var(--text)]">{nameFor(surah)}</span>
                    <span className="font-display text-base text-[var(--muted)]" dir="rtl">
                      {surah.ar}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                    {meaningFor(surah)} · {surah.ayahs} {t('surah.ayahs')}
                  </span>
                </span>
                <ExternalLink size={14} className="shrink-0 text-[var(--muted)]" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  )
}
