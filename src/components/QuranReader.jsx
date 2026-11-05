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
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  audioUrlForAyah,
  fetchPage,
  fetchSurah,
  parseAyahRef,
  TRANSLATIONS,
} from '../lib/quranApi'
import {
  blobUrlForPage,
  countCachedPages,
  downloadBlob,
  downloadPageRange,
  fetchAndCachePage,
  clearMushafCache,
} from '../lib/mushafCache'

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
      if (jumpAyah) {
        const hit = data.ayahs.find((a) => a.number === jumpAyah)
        if (hit?.page) {
          setPageNo(hit.page)
          setPageInput(String(hit.page))
        }
      } else if (data.ayahs[0]?.page) {
        setPageNo(data.ayahs[0].page)
        setPageInput(String(data.ayahs[0].page))
      }
      pageSound()
    } catch {
      setError(t('quran.error'))
    } finally {
      setLoading(false)
    }
  }

  const loadTextPage = async (n) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPage(n)
      setPageAyahs(data.ayahs)
      setPageNo(n)
      setPageInput(String(n))
    } catch {
      setError(t('quran.error'))
    } finally {
      setLoading(false)
    }
  }

  const loadMushafPage = async (n) => {
    setLoading(true)
    setError('')
    try {
      if (mushafUrlRef.current) URL.revokeObjectURL(mushafUrlRef.current)
      const local = await blobUrlForPage(n)
      const src = local || (await fetchAndCachePage(n, mushafPageFallbacks(n)))
      mushafUrlRef.current = src
      setMushafSrc(src)
      setPageNo(n)
      setPageInput(String(n))
      await refreshCacheCount()
    } catch {
      // fallback: text page layout with Quran2013
      try {
        const data = await fetchPage(n)
        setPageAyahs(data.ayahs)
        setMushafSrc('')
        setPageNo(n)
        setPageInput(String(n))
      } catch {
        setError(t('quran.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  const goPage = (n) => {
    const next = Math.min(604, Math.max(1, n))
    click()
    if (mode === 'mushaf') loadMushafPage(next)
    else if (mode === 'page') loadTextPage(next)
    else {
      setPageNo(next)
      setPageInput(String(next))
    }
  }

  const switchMode = (next) => {
    click()
    whoosh()
    setMode(next)
    stopAudio()
    if (next === 'mushaf') {
      setDownloadOpen(true)
      loadMushafPage(pageNo)
    } else if (next === 'page') {
      loadTextPage(pageNo)
    }
  }

  const runDownload = async (kind) => {
    click()
    setDownloadProgress({ done: 0, total: 1 })
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

  const readerBody = () => {
    if (mode === 'mushaf') {
      return (
        <div className={`flex flex-col ${fullscreen ? 'h-full' : ''}`}>
          <MushafToolbar
            t={t}
            pageNo={pageNo}
            pageInput={pageInput}
            setPageInput={setPageInput}
            goPage={goPage}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
            cachedCount={cachedCount}
            onDownload={() => {
              click()
              setDownloadOpen(true)
            }}
            onBack={() => {
              click()
              setMode('surah')
              setFullscreen(false)
            }}
          />
          <div className={`relative mt-3 overflow-hidden rounded-2xl bg-[#f7f1e3] ${fullscreen ? 'flex-1' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pageNo}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28 }}
                className="flex h-full min-h-[420px] items-center justify-center p-2"
              >
                {loading && <p className="text-sm text-[#6b6458]">{t('quran.loading')}</p>}
                {!loading && mushafSrc && (
                  <img
                    src={mushafSrc}
                    alt={`${t('quran.madani')} ${pageNo}`}
                    className="max-h-[70vh] w-full object-contain"
                    draggable={false}
                  />
                )}
                {!loading && !mushafSrc && pageAyahs.length > 0 && (
                  <div className="w-full space-y-3 p-4 text-center" dir="rtl">
                    {pageAyahs.map((ayah) => (
                      <p key={ayah.global} className="font-quran text-[1.45rem] leading-[2.1] text-[#1a1712]">
                        {ayah.arabic} ﴿{ayah.number}﴾
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => goPage(pageNo - 1)} className="glass rounded-full p-2 text-[var(--text)]">
              <ChevronLeft size={18} />
            </button>
            <p className="text-xs text-[var(--muted)]">
              {t('quran.page')} {pageNo} / 604 · {t('quran.juz')} {juzFromPage(pageNo)}
            </p>
            <button type="button" onClick={() => goPage(pageNo + 1)} className="glass rounded-full p-2 text-[var(--text)]">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )
    }

    if (mode === 'page') {
      return (
        <div className={`flex flex-col ${fullscreen ? 'h-full' : ''}`}>
          <MushafToolbar
            t={t}
            pageNo={pageNo}
            pageInput={pageInput}
            setPageInput={setPageInput}
            goPage={goPage}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
            cachedCount={cachedCount}
            hideDownload
            onBack={() => {
              click()
              setMode('surah')
              setFullscreen(false)
            }}
          />
          {loading && <p className="py-8 text-center text-sm text-[var(--muted)]">{t('quran.loading')}</p>}
          <div className={`mt-3 space-y-3 overflow-y-auto ${fullscreen ? 'flex-1' : 'max-h-[28rem]'}`}>
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
                  {ayah.arabic}
                </p>
              </article>
            ))}
          </div>
        </div>
      )
    }

    // surah / digital
    if (!activeSurah) {
      return (
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
      )
    }

    return (
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
            {Object.entries(TRANSLATIONS).map(([id, item]) => (
              <button
                key={id}
                type="button"
                onClick={async () => {
                  click()
                  setTrLang(id)
                  if (activeSurah) {
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
            {fullscreen ? t('quran.exitFullscreen') : t('quran.fullscreen')}
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
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold tabular-nums">
                  {activeSurah}:{ayah.number}
                </span>
                <button type="button" onClick={() => playAyah(ayah.global)} className="rounded-full bg-gold/15 p-1.5 text-gold">
                  {playing === ayah.global ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>
              <p className="font-quran text-[1.55rem] leading-[2.1] break-words text-[var(--text)]" dir="rtl">
                {ayah.arabic}
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
    )
  }

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

        {(mode === 'mushaf' || mode === 'page') && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            <select
              value={juzFromPage(pageNo)}
              onChange={(event) => {
                const juz = Number(event.target.value)
                goPage(JUZ_START_PAGE[juz - 1] || 1)
              }}
              className="rounded-xl border border-[var(--glass-border)] bg-white/5 px-2 py-1.5 text-[11px] text-[var(--text)]"
            >
              {JUZ_START_PAGE.map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {t('quran.juz')} {i + 1}
                </option>
              ))}
            </select>
            <select
              value={surahFromPage(pageNo)}
              onChange={(event) => {
                const n = Number(event.target.value)
                goPage(SURAH_START_PAGE[n - 1] || 1)
              }}
              className="max-w-[10rem] truncate rounded-xl border border-[var(--glass-border)] bg-white/5 px-2 py-1.5 text-[11px] text-[var(--text)]"
            >
              {surahs.map((s) => (
                <option key={s.n} value={s.n}>
                  {s.n}. {titleForSurah(s, lang)}
                </option>
              ))}
            </select>
          </div>
        )}

        {readerBody()}
        {error && mode !== 'surah' && <p className="mt-2 text-center text-xs text-rose-400">{error}</p>}
      </section>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-[var(--bg)] p-3"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            }}
          >
            <div className="absolute inset-0 opacity-80" style={{ background: 'var(--skin-overlay)' }} />
            <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col">{readerBody()}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {downloadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center"
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
                      style={{ width: `${Math.round((downloadProgress.done / downloadProgress.total) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {downloadProgress.done}/{downloadProgress.total} · {t('quran.page')} {downloadProgress.page}
                  </p>
                </div>
              )}

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  disabled={Boolean(downloadProgress)}
                  onClick={() => runDownload('page')}
                  className="rounded-2xl bg-gold/20 px-3 py-3 text-sm text-[var(--text)] disabled:opacity-50"
                >
                  {t('quran.downloadPage')} ({pageNo})
                </button>
                <button
                  type="button"
                  disabled={Boolean(downloadProgress)}
                  onClick={() => runDownload('juz')}
                  className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-[var(--text)] disabled:opacity-50"
                >
                  {t('quran.downloadJuz')} ({juzFromPage(pageNo)})
                </button>
                <button
                  type="button"
                  disabled={Boolean(downloadProgress)}
                  onClick={() => runDownload('all')}
                  className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-[var(--text)] disabled:opacity-50"
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
                  onClick={() => {
                    click()
                    setDownloadOpen(false)
                  }}
                  className="rounded-2xl px-3 py-2 text-sm text-[var(--muted)]"
                >
                  {t('quran.continueOnline')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function MushafToolbar({
  t,
  pageNo,
  pageInput,
  setPageInput,
  goPage,
  fullscreen,
  setFullscreen,
  cachedCount,
  onDownload,
  onBack,
  hideDownload,
}) {
  const { click } = useSound()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)]">
        <ArrowLeft size={13} />
        {t('quran.back')}
      </button>
      <form
        className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1"
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
      {!hideDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-3 py-1.5 text-xs text-[var(--text)]"
        >
          <Download size={12} />
          {t('quran.downloadShort')}
        </button>
      )}
      <span className="text-[10px] text-[var(--muted)]">{cachedCount}/604</span>
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
  )
}
