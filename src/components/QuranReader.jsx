import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Languages,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  JUZ_START_PAGE,
  SURAH_START_PAGE,
  juzFromPage,
  juzRange,
  mushafPageFallbacks,
  surahFromPage,
} from '../data/juz'
import { searchSurahs, surahs } from '../data/surahs'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'
import { withAyahEnd } from '../lib/ayahMark'
import {
  audioUrlForAyah,
  fetchPage,
  fetchSurah,
  parseAyahRef,
  TRANSLATIONS,
} from '../lib/quranApi'
import {
  blobUrlForPage,
  clearMushafCache,
  countCachedPages,
  downloadBlob,
  downloadPageRange,
  fetchAndCachePage,
} from '../lib/mushafCache'
import { mushafFooter } from '../lib/mushafMeta'

const MODES = [
  { id: 'surah', key: 'quran.modeSurah' },
  { id: 'page', key: 'quran.modePage' },
  { id: 'mushaf', key: 'quran.modeMushaf' },
]

function titleForSurah(surah, lang) {
  if (lang === 'ar') return surah.ar
  if (lang === 'en' || lang === 'uz') return surah.tr
  return surah.ru
}

function lockAppBackground(locked) {
  const root = document.documentElement
  if (locked) {
    root.dataset.mushafOpen = '1'
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  } else {
    delete root.dataset.mushafOpen
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
}

export function QuranReader() {
  const { t, lang } = useLocale()
  const { click, whoosh, page: pageSound, success, chime } = useSound()

  const [mode, setMode] = useState('surah')
  const [query, setQuery] = useState('')
  const [trLang, setTrLang] = useState(lang === 'uz' ? 'uz' : 'ru')
  const [activeSurah, setActiveSurah] = useState(null)
  const [ayahs, setAyahs] = useState([])
  const [meta, setMeta] = useState(null)
  const [pageNo, setPageNo] = useState(1)
  const [pageAyahs, setPageAyahs] = useState([])
  const [mushafSrc, setMushafSrc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTranslation, setShowTranslation] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [focusAyah, setFocusAyah] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [cachedCount, setCachedCount] = useState(0)
  const [pageInput, setPageInput] = useState('1')
  const audioRef = useRef(null)
  const listRef = useRef(null)
  const mushafUrlRef = useRef('')
  const touchX = useRef(null)
  const turning = useRef(false)

  const mushafOpen = mode === 'mushaf'
  const footer = useMemo(() => mushafFooter(pageNo, lang), [pageNo, lang])

  const results = useMemo(() => {
    const ref = parseAyahRef(query)
    if (ref) {
      const surah = surahs.find((s) => s.n === ref.surah)
      return surah ? [{ ...surah, jumpAyah: ref.ayah }] : []
    }
    return searchSurahs(query).map((s) => ({ ...s, jumpAyah: null }))
  }, [query])

  const refreshCacheCount = async () => {
    try {
      setCachedCount(await countCachedPages())
    } catch {
      setCachedCount(0)
    }
  }

  useEffect(() => {
    refreshCacheCount()
  }, [])

  useEffect(() => {
    if (lang === 'uz' || lang === 'ru') setTrLang(lang === 'uz' ? 'uz' : 'ru')
  }, [lang])

  useEffect(() => {
    lockAppBackground(mushafOpen || fullscreen)
    return () => lockAppBackground(false)
  }, [mushafOpen, fullscreen])

  useEffect(() => {
    if (!focusAyah || !ayahs.length) return undefined
    const id = window.setTimeout(() => {
      listRef.current?.querySelector(`[data-ayah="${focusAyah}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 140)
    return () => window.clearTimeout(id)
  }, [focusAyah, ayahs, fullscreen, mode])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (mushafUrlRef.current) URL.revokeObjectURL(mushafUrlRef.current)
      lockAppBackground(false)
    }
  }, [])

  const stopAudio = () => {
    audioRef.current?.pause()
    setPlaying(null)
  }

  const playAyah = (globalNumber) => {
    if (!globalNumber) return
    click()
    if (playing === globalNumber) {
      stopAudio()
      return
    }
    stopAudio()
    const audio = new Audio(audioUrlForAyah(globalNumber))
    audioRef.current = audio
    setPlaying(globalNumber)
    audio.play().catch(() => setPlaying(null))
    audio.onended = () => setPlaying(null)
  }

  const openSurah = async (surah, jumpAyah = null) => {
    click()
    whoosh()
    setMode('surah')
    setActiveSurah(surah.n)
    setFocusAyah(jumpAyah)
    setLoading(true)
    setError('')
    setAyahs([])
    try {
      const data = await fetchSurah(surah.n, trLang)
      setMeta(data)
      setAyahs(data.ayahs)
      const page = jumpAyah
        ? data.ayahs.find((a) => a.number === jumpAyah)?.page
        : data.ayahs[0]?.page
      if (page) {
        setPageNo(page)
        setPageInput(String(page))
      }
      pageSound()
    } catch {
      setError(t('quran.error'))
    } finally {
      setLoading(false)
    }
  }

  const loadTextPage = async (n) => {
    const next = Math.min(604, Math.max(1, n))
    setLoading(true)
    setError('')
    try {
      const data = await fetchPage(next)
      setPageAyahs(data.ayahs)
      setPageNo(next)
      setPageInput(String(next))
    } catch {
      setError(t('quran.error'))
    } finally {
      setLoading(false)
    }
  }

  const loadMushafPage = async (n) => {
    const next = Math.min(604, Math.max(1, n))
    if (turning.current) return
    turning.current = true
    setLoading(true)
    setError('')
    try {
      if (mushafUrlRef.current) URL.revokeObjectURL(mushafUrlRef.current)
      const local = await blobUrlForPage(next)
      const src = local || (await fetchAndCachePage(next, mushafPageFallbacks(next)))
      mushafUrlRef.current = src
      setMushafSrc(src)
      setPageNo(next)
      setPageInput(String(next))
      // also load text meta for footer accuracy
      try {
        const data = await fetchPage(next)
        setPageAyahs(data.ayahs)
      } catch {
        /* footer still works from page number */
      }
      await refreshCacheCount()
    } catch {
      try {
        const data = await fetchPage(next)
        setPageAyahs(data.ayahs)
        setMushafSrc('')
        setPageNo(next)
        setPageInput(String(next))
      } catch {
        setError(t('quran.error'))
      }
    } finally {
      setLoading(false)
      turning.current = false
    }
  }

  const goPage = (n) => {
    const next = Math.min(604, Math.max(1, n))
    if (next === pageNo && !loading) return
    click()
    if (mode === 'mushaf') loadMushafPage(next)
    else if (mode === 'page') loadTextPage(next)
    else {
      setPageNo(next)
      setPageInput(String(next))
    }
  }

  const closeMushaf = () => {
    click()
    setMode('surah')
    setFullscreen(false)
    setDownloadOpen(false)
  }

  const switchMode = (next) => {
    click()
    whoosh()
    stopAudio()
    setMode(next)
    if (next === 'mushaf') {
      setDownloadOpen(true)
      loadMushafPage(pageNo)
    } else if (next === 'page') {
      loadTextPage(pageNo)
    }
  }

  const runDownload = async (kind) => {
    click()
    setDownloadProgress({ done: 0, total: 1, page: pageNo })
    try {
      if (kind === 'page') {
        await fetchAndCachePage(pageNo, mushafPageFallbacks(pageNo))
        await downloadBlob(pageNo)
        success()
        chime()
      } else if (kind === 'juz') {
        const juz = juzFromPage(pageNo)
        const { start, end } = juzRange(juz)
        await downloadPageRange(start, end, mushafPageFallbacks, setDownloadProgress)
        success()
        chime()
      } else if (kind === 'all') {
        await downloadPageRange(1, 604, mushafPageFallbacks, setDownloadProgress)
        success()
        chime()
      }
      await refreshCacheCount()
    } catch {
      setError(t('quran.downloadError'))
    } finally {
      setDownloadProgress(null)
    }
  }

  const onTouchStart = (event) => {
    touchX.current = event.changedTouches?.[0]?.clientX ?? null
  }

  const onTouchEnd = (event) => {
    if (touchX.current == null) return
    const x = event.changedTouches?.[0]?.clientX
    if (x == null) return
    const delta = x - touchX.current
    touchX.current = null
    if (Math.abs(delta) < 48) return
    // RTL mushaf: swipe left -> next page, swipe right -> previous
    if (delta < 0) goPage(pageNo + 1)
    else goPage(pageNo - 1)
  }

  const mushafOverlay = (
    <motion.div
      key="mushaf-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('quran.madani')}
    >
      {/* Opaque blocker — no pass-through to site behind */}
      <div className="absolute inset-0 bg-[#0a0908]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(232,200,140,0.12),transparent_55%)]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col px-3">
        <div className="glass mb-2 flex flex-wrap items-center gap-2 rounded-2xl p-2">
          <button
            type="button"
            onClick={closeMushaf}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-[var(--text)]"
          >
            <X size={14} />
            {t('quran.back')}
          </button>
          <form
            className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"
            onSubmit={(event) => {
              event.preventDefault()
              goPage(Number(pageInput) || 1)
            }}
          >
            <span className="text-[10px] text-[var(--muted)]">{t('quran.page')}</span>
            <input
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value.replace(/[^\d]/g, ''))}
              className="w-12 bg-transparent text-center text-xs text-[var(--text)] outline-none"
              inputMode="numeric"
            />
            <span className="text-[10px] text-[var(--muted)]">/604</span>
          </form>
          <select
            value={juzFromPage(pageNo)}
            onChange={(event) => goPage(JUZ_START_PAGE[Number(event.target.value) - 1] || 1)}
            className="rounded-full bg-white/10 px-2 py-1.5 text-[11px] text-[var(--text)]"
          >
            {JUZ_START_PAGE.map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {t('quran.juz')} {i + 1}
              </option>
            ))}
          </select>
          <select
            value={surahFromPage(pageNo)}
            onChange={(event) => goPage(SURAH_START_PAGE[Number(event.target.value) - 1] || 1)}
            className="max-w-[8.5rem] truncate rounded-full bg-white/10 px-2 py-1.5 text-[11px] text-[var(--text)]"
          >
            {surahs.map((s) => (
              <option key={s.n} value={s.n}>
                {s.n}. {titleForSurah(s, lang)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              click()
              setDownloadOpen(true)
            }}
            className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-3 py-1.5 text-xs text-[var(--text)]"
          >
            <Download size={12} />
            {t('quran.downloadShort')}
          </button>
        </div>

        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-[#f3ead6] shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pageNo}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-2">
                {loading && <p className="text-sm text-[#6b6458]">{t('quran.loading')}</p>}
                {!loading && mushafSrc && (
                  <img
                    src={mushafSrc}
                    alt={`${t('quran.madani')} ${pageNo}`}
                    className="max-h-full w-full object-contain select-none"
                    draggable={false}
                  />
                )}
                {!loading && !mushafSrc && pageAyahs.length > 0 && (
                  <div className="w-full space-y-2 px-3 py-4 text-center" dir="rtl">
                    {pageAyahs.map((ayah) => (
                      <p
                        key={ayah.global}
                        className="font-quran text-[1.4rem] leading-[2.15] text-[#1a1712]"
                      >
                        {withAyahEnd(ayah.arabic, ayah.number)}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Madani-style footer / колонтитул */}
              <div
                className="shrink-0 border-t border-[#d4c4a4]/80 bg-[#efe4cc] px-3 py-2 text-center"
                dir="rtl"
              >
                <p className="font-quran text-[13px] leading-snug text-[#3a3226]">{footer.lineAr}</p>
                <p className="mt-0.5 text-[10px] tracking-wide text-[#6b5f4c]">
                  {t('quran.page')} {pageNo} / 604 · {t('quran.juz')} {footer.juz} · {t('quran.hizb')}{' '}
                  {footer.hizb}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 pb-1">
          <button
            type="button"
            disabled={loading || pageNo <= 1}
            onClick={() => goPage(pageNo - 1)}
            className="glass flex h-11 w-11 items-center justify-center rounded-full text-[var(--text)] disabled:opacity-40"
            aria-label={t('prev')}
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-center text-xs text-[var(--muted)]">
            {footer.surahName}
            <span className="mt-0.5 block tabular-nums">
              {pageNo} / 604
            </span>
          </p>
          <button
            type="button"
            disabled={loading || pageNo >= 604}
            onClick={() => goPage(pageNo + 1)}
            className="glass flex h-11 w-11 items-center justify-center rounded-full text-[var(--text)] disabled:opacity-40"
            aria-label={t('next')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {error && <p className="pb-2 text-center text-xs text-rose-400">{error}</p>}
      </div>
    </motion.div>
  )

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

        <div className="mb-3 flex gap-1 overflow-x-auto rounded-2xl bg-white/5 p-1">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => switchMode(item.id)}
              className={`min-w-0 flex-1 truncate rounded-xl px-2 py-2 text-[11px] transition ${
                mode === item.id ? 'bg-gold/25 text-[var(--text)]' : 'text-[var(--muted)]'
              }`}
            >
              {t(item.key)}
            </button>
          ))}
        </div>

        {mode === 'mushaf' && (
          <button
            type="button"
            onClick={() => {
              click()
              loadMushafPage(pageNo)
            }}
            className="mb-2 w-full rounded-2xl bg-gold/20 px-3 py-3 text-sm text-[var(--text)]"
          >
            {t('quran.openMushaf')} · {t('quran.page')} {pageNo}
          </button>
        )}

        {mode === 'page' && (
          <>
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
              <select
                value={juzFromPage(pageNo)}
                onChange={(event) => goPage(JUZ_START_PAGE[Number(event.target.value) - 1] || 1)}
                className="rounded-xl border border-[var(--glass-border)] bg-white/5 px-2 py-1.5 text-[11px] text-[var(--text)]"
              >
                {JUZ_START_PAGE.map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {t('quran.juz')} {i + 1}
                  </option>
                ))}
              </select>
              <form
                className="flex items-center gap-1 rounded-xl border border-[var(--glass-border)] bg-white/5 px-2 py-1"
                onSubmit={(event) => {
                  event.preventDefault()
                  goPage(Number(pageInput) || 1)
                }}
              >
                <span className="text-[10px] text-[var(--muted)]">{t('quran.page')}</span>
                <input
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value.replace(/[^\d]/g, ''))}
                  className="w-12 bg-transparent text-center text-xs text-[var(--text)] outline-none"
                  inputMode="numeric"
                />
              </form>
            </div>
            {loading && <p className="py-8 text-center text-sm text-[var(--muted)]">{t('quran.loading')}</p>}
            <div className="max-h-[28rem] space-y-3 overflow-y-auto">
              {pageAyahs.map((ayah) => (
                <article key={ayah.global} className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-3 py-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                    <span>
                      {ayah.surahEn || ayah.surah} · {ayah.surah}:{ayah.number}
                    </span>
                    <button type="button" onClick={() => playAyah(ayah.global)} className="rounded-full bg-gold/15 p-1.5 text-gold">
                      {playing === ayah.global ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                  </div>
                  <p className="font-quran text-[1.5rem] leading-[2.05] break-words text-[var(--text)]" dir="rtl">
                    {withAyahEnd(ayah.arabic, ayah.number)}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button type="button" onClick={() => goPage(pageNo - 1)} className="glass rounded-full p-2">
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-[var(--muted)]">
                {t('quran.page')} {pageNo} · {t('quran.juz')} {juzFromPage(pageNo)} · {t('quran.hizb')}{' '}
                {mushafFooter(pageNo).hizb}
              </span>
              <button type="button" onClick={() => goPage(pageNo + 1)} className="glass rounded-full p-2">
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {mode === 'surah' && !activeSurah && (
          <>
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]" />
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
                        <span className="truncate text-sm text-[var(--text)]">{titleForSurah(surah, lang)}</span>
                        <span className="font-quran text-base text-[var(--muted)]" dir="rtl">
                          {surah.ar}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                        {surah.jumpAyah ? `${surah.n}:${surah.jumpAyah}` : `${surah.ayahs} ${t('surah.ayahs')}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {mode === 'surah' && activeSurah && (
          <div className={`flex flex-col ${fullscreen ? 'h-full' : ''}`}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  click()
                  stopAudio()
                  setActiveSurah(null)
                  setFullscreen(false)
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
              <div className="flex rounded-full bg-white/5 p-0.5">
                {Object.keys(TRANSLATIONS).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={async () => {
                      click()
                      setTrLang(id)
                      setLoading(true)
                      try {
                        const data = await fetchSurah(activeSurah, id)
                        setMeta(data)
                        setAyahs(data.ayahs)
                      } catch {
                        setError(t('quran.error'))
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className={`rounded-full px-2.5 py-1 text-[10px] ${
                      trLang === id ? 'bg-gold/25 text-[var(--text)]' : 'text-[var(--muted)]'
                    }`}
                  >
                    {id.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  click()
                  setFullscreen((v) => !v)
                }}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)]"
              >
                {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>

            <div className="mb-3 text-center">
              <p className="font-quran text-2xl text-[var(--text)]" dir="rtl">
                {meta?.name || ''}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {meta?.englishName} · {t('quran.madani')} · {TRANSLATIONS[trLang]?.label}
              </p>
            </div>

            {loading && <p className="py-8 text-center text-sm text-[var(--muted)]">{t('quran.loading')}</p>}
            {error && <p className="py-4 text-center text-sm text-rose-400">{error}</p>}

            <div ref={listRef} className={`space-y-3 overflow-y-auto ${fullscreen ? 'flex-1 pr-1' : 'max-h-[28rem] pr-1'}`}>
              {ayahs.map((ayah) => (
                <article
                  key={ayah.number}
                  data-ayah={ayah.number}
                  className={`rounded-2xl border px-3 py-3 ${
                    focusAyah === ayah.number ? 'border-gold/45 bg-gold/10' : 'border-[var(--glass-border)] bg-white/5'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                    <span className="font-quran text-sm text-gold" dir="rtl">
                      {withAyahEnd('', ayah.number).trim()}
                    </span>
                    <button type="button" onClick={() => playAyah(ayah.global)} className="rounded-full bg-gold/15 p-1.5 text-gold">
                      {playing === ayah.global ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                  </div>
                  <p className="font-quran text-[1.55rem] leading-[2.1] break-words text-[var(--text)]" dir="rtl">
                    {withAyahEnd(ayah.arabic, ayah.number)}
                  </p>
                  {showTranslation && ayah.translation && (
                    <p className="mt-2 text-sm leading-relaxed break-words text-[var(--muted)]">
                      {ayah.translation}
                      <span className="mt-1 block text-[10px] opacity-70">{TRANSLATIONS[trLang]?.label}</span>
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <AnimatePresence>{mushafOpen && mushafOverlay}</AnimatePresence>

            <AnimatePresence>
              {fullscreen && mode === 'surah' && activeSurah && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] flex flex-col bg-[var(--bg)] p-3"
                  style={{
                    paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
                    paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                  }}
                >
                  <div className="absolute inset-0 bg-[var(--bg)]" />
                  <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        click()
                        setFullscreen(false)
                      }}
                      className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs"
                    >
                      <Minimize2 size={13} />
                      {t('quran.exitFullscreen')}
                    </button>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {ayahs.map((ayah) => (
                        <article
                          key={ayah.number}
                          data-ayah={ayah.number}
                          className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-3 py-3"
                        >
                          <p className="font-quran text-[1.55rem] leading-[2.1] break-words text-[var(--text)]" dir="rtl">
                            {withAyahEnd(ayah.arabic, ayah.number)}
                          </p>
                          {showTranslation && ayah.translation && (
                            <p className="mt-2 text-sm text-[var(--muted)]">{ayah.translation}</p>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {downloadOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-4 sm:items-center"
                  onClick={() => !downloadProgress && setDownloadOpen(false)}
                >
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    onClick={(event) => event.stopPropagation()}
                    className="glass w-full max-w-md rounded-3xl p-5"
                  >
                    <h4 className="font-display text-xl text-[var(--text)]">{t('quran.downloadTitle')}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t('quran.downloadHint')}</p>
                    <p className="mt-2 text-[11px] text-[var(--muted)]">
                      {t('quran.cached')}: {cachedCount} / 604
                    </p>
                    {downloadProgress && (
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-gold transition-all"
                            style={{
                              width: `${Math.round((downloadProgress.done / downloadProgress.total) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">
                          {downloadProgress.done}/{downloadProgress.total}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        disabled={Boolean(downloadProgress)}
                        onClick={() => runDownload('page')}
                        className="rounded-2xl bg-gold/20 px-3 py-3 text-sm disabled:opacity-50"
                      >
                        {t('quran.downloadPage')} ({pageNo})
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(downloadProgress)}
                        onClick={() => runDownload('juz')}
                        className="rounded-2xl bg-white/5 px-3 py-3 text-sm disabled:opacity-50"
                      >
                        {t('quran.downloadJuz')} ({juzFromPage(pageNo)})
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(downloadProgress)}
                        onClick={() => runDownload('all')}
                        className="rounded-2xl bg-white/5 px-3 py-3 text-sm disabled:opacity-50"
                      >
                        {t('quran.downloadAll')}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(downloadProgress)}
                        onClick={async () => {
                          click()
                          await clearMushafCache()
                          await refreshCacheCount()
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs text-[var(--muted)]"
                      >
                        <Trash2 size={12} />
                        {t('quran.clearCache')}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(downloadProgress)}
                        onClick={() => setDownloadOpen(false)}
                        className="rounded-2xl px-3 py-2 text-sm text-[var(--muted)]"
                      >
                        {t('quran.continueOnline')}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>,
          document.body,
        )}
    </>
  )
}
