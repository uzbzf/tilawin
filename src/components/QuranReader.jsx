import { ArrowLeft, BookOpen, Languages, Maximize2, Minimize2, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { searchSurahs, surahs } from '../data/surahs'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'
import { fetchSurah, parseAyahRef } from '../lib/quranApi'

export function QuranReader() {
  const { t, lang } = useLocale()
  const { click, whoosh, page } = useSound()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const [ayahs, setAyahs] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTranslation, setShowTranslation] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [focusAyah, setFocusAyah] = useState(null)
  const listRef = useRef(null)

  const results = useMemo(() => {
    const ref = parseAyahRef(query)
    if (ref) {
      const surah = surahs.find((s) => s.n === ref.surah)
      return surah ? [{ ...surah, jumpAyah: ref.ayah }] : []
    }
    return searchSurahs(query).map((s) => ({ ...s, jumpAyah: null }))
  }, [query])

  const openSurah = async (surah, jumpAyah = null) => {
    click()
    whoosh()
    setActive(surah.n)
    setFocusAyah(jumpAyah)
    setLoading(true)
    setError('')
    setAyahs([])
    try {
      const data = await fetchSurah(surah.n)
      setMeta(data)
      setAyahs(data.ayahs)
      page()
    } catch {
      setError(t('quran.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!focusAyah || !ayahs.length) return undefined
    const id = window.setTimeout(() => {
      const node = listRef.current?.querySelector(`[data-ayah="${focusAyah}"]`)
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
    return () => window.clearTimeout(id)
  }, [focusAyah, ayahs, fullscreen])

  const titleFor = (surah) => {
    if (lang === 'ar') return surah.ar
    if (lang === 'en') return surah.tr
    return surah.ru
  }

  const reader = active ? (
    <div className={`flex flex-col ${fullscreen ? 'h-full' : ''}`}>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            click()
            setActive(null)
            setFullscreen(false)
            setFocusAyah(null)
          }}
          className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)]"
        >
          <ArrowLeft size={13} />
          {t('quran.back')}
        </button>
        <button
          type="button"
          onClick={() => {
            click()
            setShowTranslation((v) => !v)
          }}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${
            showTranslation ? 'bg-gold/20 text-[var(--text)]' : 'bg-white/5 text-[var(--muted)]'
          }`}
        >
          <Languages size={13} />
          {showTranslation ? t('quran.withTranslation') : t('quran.arabicOnly')}
        </button>
        <button
          type="button"
          onClick={() => {
            click()
            setFullscreen((v) => !v)
          }}
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)]"
        >
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {fullscreen ? t('quran.exitFullscreen') : t('quran.fullscreen')}
        </button>
      </div>

      <div className="mb-3 text-center">
        <p className="font-quran text-2xl text-[var(--text)]" dir="rtl">
          {meta?.name || ''}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {meta?.englishName} · {t('quran.madani')}
        </p>
      </div>

      {loading && <p className="py-8 text-center text-sm text-[var(--muted)]">{t('quran.loading')}</p>}
      {error && <p className="py-8 text-center text-sm text-rose-400">{error}</p>}

      <div
        ref={listRef}
        className={`space-y-3 overflow-y-auto ${fullscreen ? 'flex-1 pr-1' : 'max-h-[28rem] pr-1'}`}
      >
        {ayahs.map((ayah) => (
          <article
            key={ayah.number}
            data-ayah={ayah.number}
            className={`rounded-2xl border px-3 py-3 ${
              focusAyah === ayah.number
                ? 'border-gold/45 bg-gold/10'
                : 'border-[var(--glass-border)] bg-white/5'
            }`}
          >
            <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold tabular-nums">
                {active}:{ayah.number}
              </span>
              <span>
                {t('quran.page')} {ayah.page}
              </span>
            </div>
            <p className="font-quran text-[1.55rem] leading-[2.1] break-words text-[var(--text)]" dir="rtl">
              {ayah.arabic}
            </p>
            {showTranslation && ayah.translation && (
              <p className="mt-2 text-sm leading-relaxed break-words text-[var(--muted)]">
                {ayah.translation}
                <span className="mt-1 block text-[10px] opacity-70">{t('quran.translator')}</span>
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  ) : null

  return (
    <>
      <section className="glass overflow-hidden rounded-3xl p-4" aria-label={t('quran.title')}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <BookOpen size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-xl text-[var(--text)]">{t('quran.title')}</h3>
            <p className="text-[11px] text-[var(--muted)]">{t('quran.hint')}</p>
          </div>
        </div>

        {!active && (
          <>
            <label className="relative block">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('quran.search')}
                className="w-full rounded-2xl border border-[var(--glass-border)] bg-white/5 py-2.5 pr-3 pl-9 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-gold/40"
              />
            </label>
            <p className="mt-1.5 text-[10px] text-[var(--muted)]">{t('quran.searchHint')}</p>

            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {results.map((surah) => (
                <li key={surah.n}>
                  <button
                    type="button"
                    onClick={() => openSurah(surah, surah.jumpAyah)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-white/5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-xs font-semibold text-gold tabular-nums">
                      {surah.n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-[var(--text)]">{titleFor(surah)}</span>
                        <span className="font-quran text-base text-[var(--muted)]" dir="rtl">
                          {surah.ar}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                        {surah.jumpAyah
                          ? `${surah.n}:${surah.jumpAyah}`
                          : `${surah.ayahs} ${t('surah.ayahs')}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {active && !fullscreen && reader}
      </section>

      <AnimatePresence>
        {fullscreen && active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-[var(--bg)] p-4"
            style={{
              paddingTop: 'max(1rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            }}
          >
            <div className="absolute inset-0 opacity-80" style={{ background: 'var(--skin-overlay)' }} />
            <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col">{reader}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
