import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Languages,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { ArabicWithAyahEnd } from './AyahEnd'
import {
  audioUrlForAyah,
  fetchPage,
  fetchSurah,
  parseAyahRef,
  TRANSLATIONS,
} from '../lib/quranApi'
import { RECITERS, readReciter, reciterLabel, writeReciter } from '../lib/reciters'
import {
  blobUrlForPage,
  clearMushafCache,
  countCachedPages,
  downloadBlob,
  downloadPageRange,
  fetchAndCachePage,
} from '../lib/mushafCache'
import { mushafFooter } from '../lib/mushafMeta'
import {
  hydrateBookmarksAsync,
  hydrateProgressAsync,
  readBookmarks,
  readLastProgress,
  removeAyahBookmark,
  toggleAyahBookmark,
  writeLastProgress,
} from '../lib/mushafStorage'

const MODES = [
  { id: 'surah', key: 'quran.modeSurah' },
  { id: 'page', key: 'quran.modePage' },
  { id: 'mushaf', key: 'quran.modeMushaf' },
  { id: 'bookmarks', key: 'quran.bookmarks' },
]

/**
 * RTL page transition variants:
 * dir < 0 => next page in Arabic Mushaf (moving left: new page enters from left, old exits right)
 * dir > 0 => previous page in Arabic Mushaf (moving right: new page enters from right, old exits left)
 */
const MUSHAF_PAGE_VARIANTS = {
  enter: (dir) => ({
    opacity: 0,
    x: dir < 0 ? -42 : 42,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir < 0 ? 42 : -42,
  }),
}

function titleForSurah(surah, lang) {
  if (!surah) return ''
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

  const [lastProgress, setLastProgress] = useState(() => readLastProgress())
  const [bookmarks, setBookmarks] = useState(() => readBookmarks())
  const [mode, setMode] = useState('surah')
  const [query, setQuery] = useState('')
  const [trLang, setTrLang] = useState(lang === 'uz' ? 'uz' : 'ru')
  const [activeSurah, setActiveSurah] = useState(null)
  const [ayahs, setAyahs] = useState([])
  const [meta, setMeta] = useState(null)
  const [pageNo, setPageNo] = useState(() => readLastProgress()?.page || 1)
  const [pageAyahs, setPageAyahs] = useState([])
  const [mushafSrc, setMushafSrc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTranslation, setShowTranslation] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [mushafFullscreen, setMushafFullscreen] = useState(false)
  const [focusAyah, setFocusAyah] = useState(null)
  const [highlightAyahKey, setHighlightAyahKey] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [mushafBookmarksOpen, setMushafBookmarksOpen] = useState(false)
  const [customBmSurah, setCustomBmSurah] = useState(() => surahFromPage(readLastProgress()?.page || 1))
  const [customBmAyah, setCustomBmAyah] = useState(1)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [cachedCount, setCachedCount] = useState(0)
  const [pageInput, setPageInput] = useState(() => String(readLastProgress()?.page || 1))
  const [reciterId, setReciterId] = useState(() => readReciter())
  // RTL direction: -1 = next page (left), +1 = previous page (right)
  const [turnDir, setTurnDir] = useState(-1)

  const audioRef = useRef(null)
  const listRef = useRef(null)
  const mushafUrlRef = useRef('')
  const gestureStartRef = useRef(null)
  const turning = useRef(false)

  const mushafOpen = mode === 'mushaf'
  const footer = useMemo(() => mushafFooter(pageNo, lang), [pageNo, lang])

  const bookmarkedMap = useMemo(() => {
    const map = new Map()
    for (const bm of bookmarks) {
      map.set(bm.id, bm)
    }
    return map
  }, [bookmarks])

  const currentPageBookmarks = useMemo(
    () => bookmarks.filter((bm) => bm.page === pageNo),
    [bookmarks, pageNo],
  )

  const results = useMemo(() => {
    const ref = parseAyahRef(query)
    if (ref) {
      const surah = surahs.find((s) => s.n === ref.surah)
      return surah ? [{ ...surah, jumpAyah: ref.ayah }] : []
    }
    return searchSurahs(query).map((s) => ({ ...s, jumpAyah: null }))
  }, [query])

  const saveProgress = useCallback((patch) => {
    const saved = writeLastProgress(patch)
    if (saved) setLastProgress(saved)
    return saved
  }, [])

  const refreshCacheCount = async () => {
    try {
      setCachedCount(await countCachedPages())
    } catch {
      setCachedCount(0)
    }
  }

  useEffect(() => {
    refreshCacheCount()
    hydrateProgressAsync().then((hydrated) => {
      if (hydrated) {
        setLastProgress(hydrated)
        setPageNo((prev) => (prev === 1 ? hydrated.page : prev))
        setPageInput((prev) => (prev === '1' ? String(hydrated.page) : prev))
      }
    })
    hydrateBookmarksAsync().then((hydrated) => {
      if (Array.isArray(hydrated) && hydrated.length > 0) {
        setBookmarks(hydrated)
      }
    })
  }, [])

  const openMushafBookmarksSheet = () => {
    click()
    const defaultSurah = pageAyahs[0]?.surah || surahFromPage(pageNo)
    const defaultAyah = pageAyahs[0]?.number || 1
    setCustomBmSurah(defaultSurah)
    setCustomBmAyah(defaultAyah)
    setMushafBookmarksOpen(true)
  }

  useEffect(() => {
    if (lang === 'uz' || lang === 'ru') setTrLang(lang === 'uz' ? 'uz' : 'ru')
  }, [lang])

  useEffect(() => {
    lockAppBackground(mushafOpen || fullscreen)
    return () => lockAppBackground(false)
  }, [mushafOpen, fullscreen])

  useEffect(() => {
    if (!mushafOpen) {
      setMushafFullscreen(false)
      setMushafBookmarksOpen(false)
    }
  }, [mushafOpen])

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

  const playAyah = (globalNumber, ayahMeta = {}) => {
    if (!globalNumber) return
    click()
    if (playing === globalNumber) {
      stopAudio()
      return
    }
    stopAudio()
    const audio = new Audio(
      audioUrlForAyah(globalNumber, {
        surah: ayahMeta.surah || activeSurah,
        ayah: ayahMeta.ayah || ayahMeta.number,
        reciterId,
      }),
    )
    audioRef.current = audio
    setPlaying(globalNumber)
    audio.play().catch(() => setPlaying(null))
    audio.onended = () => setPlaying(null)
  }

  const onReciterChange = (id) => {
    click()
    writeReciter(id)
    setReciterId(id)
    stopAudio()
  }

  const handleToggleBookmark = (entry) => {
    click()
    const { bookmarks: nextList, added, item } = toggleAyahBookmark(entry)
    setBookmarks(nextList)
    if (added && item) {
      success()
      saveProgress({
        page: item.page,
        surah: item.surah,
        ayah: item.ayah,
        mode: mode === 'bookmarks' ? 'mushaf' : mode,
      })
    }
  }

  const handleRemoveBookmark = (id) => {
    click()
    setBookmarks(removeAyahBookmark(id))
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
      const resolvedPage = page || SURAH_START_PAGE[surah.n - 1] || 1
      setPageNo(resolvedPage)
      setPageInput(String(resolvedPage))
      saveProgress({
        page: resolvedPage,
        surah: surah.n,
        ayah: jumpAyah || 1,
        mode: 'surah',
      })
      pageSound()
    } catch {
      setError(t('quran.error'))
    } finally {
      setLoading(false)
    }
  }

  const loadTextPage = useCallback(
    async (n, directionHint = null) => {
      const next = Math.min(604, Math.max(1, n))
      setTurnDir(directionHint ?? (next >= pageNo ? -1 : 1))
      setLoading(true)
      setError('')
      try {
        const data = await fetchPage(next)
        setPageAyahs(data.ayahs)
        setPageNo(next)
        setPageInput(String(next))
        const firstAyah = data.ayahs?.[0]
        saveProgress({
          page: next,
          surah: firstAyah?.surah || surahFromPage(next),
          ayah: firstAyah?.number || null,
          mode: 'page',
        })
        pageSound()
      } catch {
        setError(t('quran.error'))
      } finally {
        setLoading(false)
      }
    },
    [pageNo, pageSound, saveProgress, t],
  )

  const loadMushafPage = useCallback(
    async (n, opts = {}) => {
      const next = Math.min(604, Math.max(1, n))
      if (turning.current) return
      turning.current = true
      setTurnDir(opts.dir ?? (next >= pageNo ? -1 : 1))
      setLoading(true)
      setError('')
      if (opts.highlightKey !== undefined) {
        setHighlightAyahKey(opts.highlightKey)
      } else if (next !== pageNo) {
        setHighlightAyahKey(null)
      }

      try {
        if (mushafUrlRef.current) URL.revokeObjectURL(mushafUrlRef.current)
        const local = await blobUrlForPage(next)
        const src = local || (await fetchAndCachePage(next, mushafPageFallbacks(next)))
        mushafUrlRef.current = src
        setMushafSrc(src)
        setPageNo(next)
        setPageInput(String(next))

        let firstSurah = opts.surah || surahFromPage(next)
        let firstAyah = opts.ayah || null
        // also load text meta for footer accuracy & page ayahs bookmarking
        try {
          const data = await fetchPage(next)
          setPageAyahs(data.ayahs)
          if (!opts.surah && data.ayahs?.[0]?.surah) {
            firstSurah = data.ayahs[0].surah
          }
        } catch {
          /* footer still works from page number */
        }
        saveProgress({
          page: next,
          surah: firstSurah,
          ayah: firstAyah,
          mode: 'mushaf',
        })
        pageSound()
        await refreshCacheCount()
      } catch {
        try {
          const data = await fetchPage(next)
          setPageAyahs(data.ayahs)
          setMushafSrc('')
          setPageNo(next)
          setPageInput(String(next))
          saveProgress({
            page: next,
            surah: opts.surah || data.ayahs?.[0]?.surah || surahFromPage(next),
            ayah: opts.ayah || null,
            mode: 'mushaf',
          })
          pageSound()
        } catch {
          setError(t('quran.error'))
          saveProgress({
            page: next,
            surah: opts.surah || surahFromPage(next),
            ayah: opts.ayah || null,
            mode: 'mushaf',
          })
        }
      } finally {
        setLoading(false)
        turning.current = false
      }
    },
    [pageNo, pageSound, saveProgress, t],
  )

  const goPage = useCallback(
    (n) => {
      const next = Math.min(604, Math.max(1, n))
      if (next === pageNo && !loading) return
      const dir = next >= pageNo ? -1 : 1
      setTurnDir(dir)
      click()
      if (mode === 'mushaf') loadMushafPage(next, { dir })
      else if (mode === 'page') loadTextPage(next, dir)
      else {
        setPageNo(next)
        setPageInput(String(next))
        saveProgress({ page: next, surah: surahFromPage(next), mode })
      }
    },
    [click, loadMushafPage, loadTextPage, loading, mode, pageNo, saveProgress],
  )

  // Keyboard navigation in Mushaf and Page modes:
  // RTL Arabic Mushaf: ArrowLeft -> Next page (pageNo + 1), ArrowRight -> Previous page (pageNo - 1)
  useEffect(() => {
    if (mode !== 'mushaf' && mode !== 'page') return undefined
    const onKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        if (pageNo < 604) goPage(pageNo + 1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (pageNo > 1) goPage(pageNo - 1)
      } else if (event.key === 'Escape' && mode === 'mushaf') {
        if (mushafBookmarksOpen) setMushafBookmarksOpen(false)
        else if (downloadOpen) setDownloadOpen(false)
        else if (mushafFullscreen) setMushafFullscreen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [downloadOpen, goPage, mode, mushafBookmarksOpen, mushafFullscreen, pageNo])

  const closeMushaf = () => {
    click()
    setMode('surah')
    setFullscreen(false)
    setMushafFullscreen(false)
    setDownloadOpen(false)
    setMushafBookmarksOpen(false)
  }

  const openMushafAt = (targetPage, opts = {}) => {
    const resolved = Math.min(604, Math.max(1, Number(targetPage) || lastProgress?.page || pageNo || 1))
    click()
    whoosh()
    stopAudio()
    setDownloadOpen(false)
    setMushafBookmarksOpen(false)
    setMode('mushaf')
    loadMushafPage(resolved, opts)
  }

  const openBookmarkInSurah = (bm) => {
    const targetSurah = surahs.find((s) => s.n === bm.surah)
    if (!targetSurah) return
    setMushafBookmarksOpen(false)
    setMushafFullscreen(false)
    openSurah(targetSurah, bm.ayah)
  }

  const switchMode = (next) => {
    click()
    whoosh()
    stopAudio()
    setMode(next)
    if (next === 'mushaf') {
      const targetPage = lastProgress?.page || pageNo || 1
      loadMushafPage(targetPage)
    } else if (next === 'page') {
      const targetPage = lastProgress?.page || pageNo || 1
      loadTextPage(targetPage)
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

  /**
   * RTL Mushaf swipe/drag gesture handling:
   * - Swipe left (deltaX < 0, moving finger right -> left) => Next page (pageNo + 1)
   * - Swipe right (deltaX > 0, moving finger left -> right) => Previous page (pageNo - 1)
   */
  const handleGestureStart = (clientX, clientY) => {
    if (clientX == null) return
    gestureStartRef.current = { x: clientX, y: clientY ?? 0 }
  }

  const handleGestureEnd = (clientX, clientY) => {
    if (!gestureStartRef.current || clientX == null) return
    const deltaX = clientX - gestureStartRef.current.x
    const deltaY = (clientY ?? 0) - gestureStartRef.current.y
    gestureStartRef.current = null
    if (Math.abs(deltaX) < 42) return
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.15) return
    if (deltaX < 0) {
      if (pageNo < 604) goPage(pageNo + 1)
    } else if (pageNo > 1) {
      goPage(pageNo - 1)
    }
  }

  const onTouchStart = (event) => {
    const touch = event.changedTouches?.[0]
    handleGestureStart(touch?.clientX, touch?.clientY)
  }

  const onTouchEnd = (event) => {
    const touch = event.changedTouches?.[0]
    handleGestureEnd(touch?.clientX, touch?.clientY)
  }

  const onPointerDown = (event) => {
    if (event.pointerType === 'touch') return
    if (event.button !== 0) return
    handleGestureStart(event.clientX, event.clientY)
  }

  const onPointerUp = (event) => {
    if (event.pointerType === 'touch') return
    handleGestureEnd(event.clientX, event.clientY)
  }

  const savedSurahMeta = useMemo(
    () => (lastProgress?.surah ? surahs.find((s) => s.n === lastProgress.surah) : null),
    [lastProgress],
  )

  const selectedCustomSurahMeta = useMemo(
    () => surahs.find((s) => s.n === Number(customBmSurah)) || surahs[0],
    [customBmSurah],
  )

  const mushafOverlay = (
    <motion.div
      key="mushaf-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        paddingTop: mushafFullscreen ? 0 : 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: mushafFullscreen ? 0 : 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('quran.madani')}
    >
      {/* Opaque blocker — no pass-through to site behind */}
      <div className="absolute inset-0 bg-[#0a0908]" aria-hidden />
      {!mushafFullscreen && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(232,200,140,0.12),transparent_55%)]" />
      )}

      <div
        className={`relative z-10 mx-auto flex h-full w-full flex-col ${
          mushafFullscreen ? 'max-w-none px-0' : 'max-w-lg px-3'
        }`}
      >
        {!mushafFullscreen && (
          <div className="glass-strong mb-2 flex flex-wrap items-center gap-1.5 rounded-2xl p-2">
            <button
              type="button"
              onClick={closeMushaf}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-xs text-[var(--text)]"
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
                className="w-11 bg-transparent text-center text-xs text-[var(--text)] outline-none"
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
              className="max-w-[7.75rem] truncate rounded-full bg-white/10 px-2 py-1.5 text-[11px] text-[var(--text)]"
            >
              {surahs.map((s) => (
                <option key={s.n} value={s.n}>
                  {s.n}. {titleForSurah(s, lang)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openMushafBookmarksSheet}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs transition ${
                currentPageBookmarks.length > 0
                  ? 'bg-gold/30 text-gold'
                  : 'bg-white/10 text-[var(--text)]'
              }`}
              aria-label={t('quran.bookmarks')}
            >
              <Bookmark
                size={12}
                className={currentPageBookmarks.length > 0 ? 'fill-current' : ''}
              />
              <span>{t('quran.bookmarks')}</span>
              {bookmarks.length > 0 && (
                <span className="rounded-full bg-black/25 px-1.5 py-0.2 text-[10px] tabular-nums">
                  {bookmarks.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                click()
                setDownloadOpen(true)
              }}
              className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-2.5 py-1.5 text-xs text-[var(--text)]"
            >
              <Download size={12} />
              {t('quran.downloadShort')}
            </button>
            <button
              type="button"
              onClick={() => {
                click()
                setMushafFullscreen(true)
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-xs text-[var(--text)]"
              aria-label={t('quran.fullscreen')}
            >
              <Maximize2 size={12} />
            </button>
          </div>
        )}

        <div
          dir="rtl"
          className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f3ead6] select-none ${
            mushafFullscreen ? 'rounded-none' : 'rounded-3xl shadow-[0_0_0_1px_rgba(0,0,0,0.2)]'
          }`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {mushafFullscreen && (
            <div
              dir="ltr"
              className="absolute top-2 right-2 left-2 z-20 flex items-center justify-between gap-2 pointer-events-none"
            >
              <button
                type="button"
                onClick={openMushafBookmarksSheet}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-[11px] text-white backdrop-blur-md"
              >
                <Bookmark
                  size={12}
                  className={currentPageBookmarks.length > 0 ? 'fill-amber-300 text-amber-300' : ''}
                />
                {t('quran.bookmarks')}
                {bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  click()
                  setMushafFullscreen(false)
                }}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-[11px] text-white backdrop-blur-md"
              >
                <Minimize2 size={12} />
                {t('quran.exitFullscreen')}
              </button>
            </div>
          )}

          {mushafFullscreen && (
            <div
              dir="ltr"
              className="pointer-events-none absolute inset-x-2 bottom-3 z-20 flex items-center justify-between"
            >
              {/* Left = Next page in RTL Mushaf */}
              <button
                type="button"
                disabled={loading || pageNo >= 604}
                onClick={() => goPage(pageNo + 1)}
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md disabled:opacity-30"
                aria-label={t('quran.nextPage')}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] text-white tabular-nums backdrop-blur-md">
                {pageNo} / 604
              </span>
              {/* Right = Previous page in RTL Mushaf */}
              <button
                type="button"
                disabled={loading || pageNo <= 1}
                onClick={() => goPage(pageNo - 1)}
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md disabled:opacity-30"
                aria-label={t('quran.prevPage')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {currentPageBookmarks.length > 0 && !mushafFullscreen && (
            <div
              dir="ltr"
              className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#d4c4a4]/80 bg-[#e8dab8]/90 px-3 py-1.5 text-[11px] text-[#3a3226]"
            >
              <span className="inline-flex items-center gap-1 font-medium">
                <Bookmark size={12} className="fill-[#8a6d3b] text-[#8a6d3b]" />
                {t('quran.bookmarkAdded')}:{' '}
                {currentPageBookmarks.map((b) => `${b.surah}:${b.ayah}`).join(', ')}
              </span>
              <button
                type="button"
                onClick={openMushafBookmarksSheet}
                className="rounded-full bg-[#3a3226]/10 px-2 py-0.5 text-[10px] font-medium text-[#3a3226]"
              >
                {t('quran.pageAyahsTitle')}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait" custom={turnDir}>
            <motion.div
              key={pageNo}
              custom={turnDir}
              variants={MUSHAF_PAGE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div
                className={`flex min-h-0 flex-1 items-center justify-center overflow-auto ${
                  mushafFullscreen ? 'p-0' : 'p-2'
                }`}
              >
                {loading && <p className="text-sm text-[#6b6458]">{t('quran.loading')}</p>}
                {!loading && mushafSrc && (
                  <img
                    src={mushafSrc}
                    alt={`${t('quran.madani')} ${pageNo}`}
                    className={`w-full select-none ${
                      mushafFullscreen ? 'h-full max-h-none object-contain' : 'max-h-full object-contain'
                    }`}
                    draggable={false}
                  />
                )}
                {!loading && !mushafSrc && pageAyahs.length > 0 && (
                  <div className="w-full space-y-3 px-3 py-4 text-center" dir="rtl">
                    {(() => {
                      const firstSurah = pageAyahs[0]?.surah
                      const surahMeta = surahs.find((s) => s.n === firstSurah)
                      return surahMeta ? (
                        <div className="mb-3 text-center">
                          <p className="font-quran text-[1.65rem] leading-relaxed text-[#1a1712]" dir="rtl">
                            {`سُورَةُ ${surahMeta.ar}`}
                          </p>
                          <p className="mt-1 text-[10px] tracking-wide text-[#6b5f4c]">
                            {titleForSurah(surahMeta, lang)}
                          </p>
                        </div>
                      ) : null
                    })()}
                    {pageAyahs.map((ayah) => {
                      const bmKey = `${ayah.surah}:${ayah.number}`
                      const isBm = bookmarkedMap.has(bmKey)
                      const isHighlighted = highlightAyahKey === bmKey
                      return (
                        <div
                          key={ayah.global}
                          className={`rounded-2xl px-2 py-1.5 transition ${
                            isBm || isHighlighted ? 'bg-[#d4c4a4]/45 ring-1 ring-[#8a6d3b]/40' : ''
                          }`}
                        >
                          <p className="font-quran text-[1.4rem] leading-[2.15] text-[#1a1712]">
                            <ArabicWithAyahEnd text={ayah.arabic} number={ayah.number} />
                          </p>
                          <div className="mt-1 flex items-center justify-center gap-2" dir="ltr">
                            <span className="text-[10px] text-[#6b5f4c]">
                              {ayah.surah}:{ayah.number}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleBookmark({
                                  surah: ayah.surah,
                                  ayah: ayah.number,
                                  page: pageNo,
                                  arabic: ayah.arabic,
                                })
                              }
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                                isBm
                                  ? 'bg-[#8a6d3b] text-white'
                                  : 'bg-[#3a3226]/10 text-[#3a3226]'
                              }`}
                            >
                              <Bookmark size={10} className={isBm ? 'fill-current' : ''} />
                              {isBm ? t('quran.bookmarkAdded') : t('quran.bookmarkAdd')}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {!mushafFullscreen && (
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
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RTL Mushaf Navigation Bar:
            Physical LEFT = Next Page (pageNo + 1, moving left in Arabic Mushaf)
            Physical RIGHT = Previous Page (pageNo - 1, moving right in Arabic Mushaf) */}
        {!mushafFullscreen && (
          <div dir="ltr" className="mt-2 flex items-center justify-between gap-2 pb-1">
            <button
              type="button"
              disabled={loading || pageNo >= 604}
              onClick={() => goPage(pageNo + 1)}
              className="glass-strong inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-[var(--text)] disabled:opacity-40"
              aria-label={t('quran.nextPage')}
            >
              <ChevronLeft size={18} />
              <span>{t('quran.nextPage')}</span>
            </button>

            <div className="min-w-0 flex-1 px-1 text-center">
              <p className="truncate text-xs text-[var(--muted)]">
                {footer.surahName}
                <span className="mt-0.5 block tabular-nums">{pageNo} / 604</span>
              </p>
              {/* RTL progress bar: fills from right (page 1) to left (page 604) */}
              <div
                dir="rtl"
                className="mx-auto mt-1 h-1 w-28 overflow-hidden rounded-full bg-white/10"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-gold transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(1, (pageNo / 604) * 100))}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={loading || pageNo <= 1}
              onClick={() => goPage(pageNo - 1)}
              className="glass-strong inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-[var(--text)] disabled:opacity-40"
              aria-label={t('quran.prevPage')}
            >
              <span>{t('quran.prevPage')}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        {error && <p className="pb-2 text-center text-xs text-rose-400">{error}</p>}
      </div>
    </motion.div>
  )

  return (
    <>
      <section className="glass overflow-hidden rounded-3xl p-4" aria-label={t('quran.title')}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <BookOpen size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-xl text-[var(--text)]">{t('quran.title')}</h3>
              <p className="truncate text-[11px] text-[var(--muted)]">{t('quran.hint')}</p>
            </div>
          </div>
        </div>

        {/* Auto-saved reading progress banner: prompt user to continue from last saved page */}
        {lastProgress?.page && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text)]">
                {t('quran.continueReading')}: {t('quran.page')} {lastProgress.page}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                {savedSurahMeta ? `${savedSurahMeta.n}. ${titleForSurah(savedSurahMeta, lang)}` : ''}
                {lastProgress.ayah ? ` · ${lastProgress.surah}:${lastProgress.ayah}` : ''}
                {` · ${t('quran.juz')} ${lastProgress.juz}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  openMushafAt(lastProgress.page, {
                    surah: lastProgress.surah,
                    ayah: lastProgress.ayah,
                    highlightKey: lastProgress.ayah
                      ? `${lastProgress.surah}:${lastProgress.ayah}`
                      : null,
                  })
                }
                className="inline-flex items-center gap-1 rounded-xl bg-gold/25 px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-gold/35"
              >
                <BookOpen size={13} />
                {t('quran.continueMushaf')} · {t('quran.page')} {lastProgress.page}
              </button>
              {lastProgress.surah && lastProgress.ayah && savedSurahMeta && (
                <button
                  type="button"
                  onClick={() => openSurah(savedSurahMeta, lastProgress.ayah)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs text-[var(--text)]"
                  title={`${t('quran.openAyahText')} ${lastProgress.surah}:${lastProgress.ayah}`}
                >
                  {lastProgress.surah}:{lastProgress.ayah}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-3 flex gap-1 overflow-x-auto rounded-2xl bg-white/5 p-1">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => switchMode(item.id)}
              className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1 truncate rounded-xl px-2 py-2 text-[11px] transition ${
                mode === item.id ? 'bg-gold/25 text-[var(--text)]' : 'text-[var(--muted)]'
              }`}
            >
              <span className="truncate">{t(item.key)}</span>
              {item.id === 'bookmarks' && bookmarks.length > 0 && (
                <span className="rounded-full bg-gold/25 px-1.5 py-0.2 text-[10px] font-semibold tabular-nums text-gold">
                  {bookmarks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {mode === 'mushaf' && (
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openMushafAt(lastProgress?.page || pageNo)}
              className="flex-1 rounded-2xl bg-gold/20 px-3 py-3 text-sm font-medium text-[var(--text)]"
            >
              {t('quran.openMushaf')} · {t('quran.page')} {lastProgress?.page || pageNo}
            </button>
            {(lastProgress?.page || pageNo) > 1 && (
              <button
                type="button"
                onClick={() => openMushafAt(1)}
                className="inline-flex items-center gap-1 rounded-2xl bg-white/5 px-3 py-3 text-xs text-[var(--muted)]"
              >
                <RotateCcw size={13} />
                {t('quran.startFromFirst')}
              </button>
            )}
          </div>
        )}

        {mode === 'bookmarks' && (
          <div className="space-y-2.5">
            {bookmarks.length === 0 ? (
              <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-8 text-center">
                <Bookmark size={22} className="mx-auto mb-2 text-gold opacity-70" />
                <p className="text-xs leading-relaxed text-[var(--muted)]">{t('quran.bookmarksEmpty')}</p>
              </div>
            ) : (
              <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {bookmarks.map((bm) => {
                  const sMeta = surahs.find((s) => s.n === bm.surah)
                  return (
                    <article
                      key={bm.id}
                      className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gold">
                              {bm.surah}:{bm.ayah}
                            </span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tabular-nums text-[var(--text)]">
                              {t('quran.page')} {bm.page}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">
                              {t('quran.juz')} {bm.juz}
                            </span>
                          </div>
                          {sMeta && (
                            <p className="mt-1 text-xs font-medium text-[var(--text)]">
                              {sMeta.n}. {titleForSurah(sMeta, lang)}{' '}
                              <span className="font-quran text-sm text-[var(--muted)]" dir="rtl">
                                ({sMeta.ar})
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openMushafAt(bm.page, {
                                surah: bm.surah,
                                ayah: bm.ayah,
                                highlightKey: bm.id,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-xl bg-gold/25 px-2.5 py-1.5 text-[11px] font-medium text-[var(--text)]"
                          >
                            <BookOpen size={12} />
                            {t('quran.openInMushaf')} · {t('quran.page')} {bm.page}
                          </button>
                          <button
                            type="button"
                            onClick={() => openBookmarkInSurah(bm)}
                            className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] text-[var(--text)]"
                          >
                            {t('quran.openAyahText')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBookmark(bm.id)}
                            className="rounded-xl bg-white/5 p-1.5 text-[var(--muted)] hover:text-rose-400"
                            aria-label={t('quran.bookmarkRemove')}
                            title={t('quran.bookmarkRemove')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {bm.arabic && (
                        <p
                          className="font-quran mt-2 line-clamp-2 text-right text-[1.25rem] leading-[1.95] text-[var(--text)]"
                          dir="rtl"
                        >
                          <ArabicWithAyahEnd text={bm.arabic} number={bm.ayah} />
                        </p>
                      )}
                      {bm.translation && (
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{bm.translation}</p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {mode === 'page' && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
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
                <span className="text-[10px] text-[var(--muted)]">/604</span>
              </form>
              <button
                type="button"
                onClick={() => openMushafAt(pageNo)}
                className="ml-auto inline-flex items-center gap-1 rounded-xl bg-gold/20 px-2.5 py-1.5 text-[11px] text-[var(--text)]"
              >
                <BookOpen size={12} />
                {t('quran.openInMushaf')}
              </button>
            </div>
            {loading && <p className="py-8 text-center text-sm text-[var(--muted)]">{t('quran.loading')}</p>}
            <div className="max-h-[28rem] space-y-3 overflow-y-auto">
              {pageAyahs.map((ayah) => {
                const bmKey = `${ayah.surah}:${ayah.number}`
                const isBm = bookmarkedMap.has(bmKey)
                return (
                  <article
                    key={ayah.global}
                    className={`rounded-2xl border px-3 py-3 transition ${
                      isBm ? 'border-gold/45 bg-gold/10' : 'border-[var(--glass-border)] bg-white/5'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 tabular-nums text-gold">
                          {ayah.surah}:{ayah.number}
                        </span>
                        <span>
                          {ayah.surahEn || ayah.surah} · {t('quran.page')} {ayah.page || pageNo}
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleBookmark({
                              surah: ayah.surah,
                              ayah: ayah.number,
                              page: ayah.page || pageNo,
                              arabic: ayah.arabic,
                            })
                          }
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] transition ${
                            isBm ? 'bg-gold/25 text-gold' : 'bg-white/5 text-[var(--muted)] hover:text-gold'
                          }`}
                          aria-label={isBm ? t('quran.bookmarkRemove') : t('quran.bookmarkAdd')}
                          title={isBm ? t('quran.bookmarkAdded') : t('quran.bookmarkAdd')}
                        >
                          <Bookmark size={12} className={isBm ? 'fill-current' : ''} />
                          <span>{isBm ? t('quran.bookmarkAdded') : t('quran.bookmarkAdd')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => playAyah(ayah.global, { surah: ayah.surah, ayah: ayah.number })}
                          className="rounded-full bg-gold/15 p-1.5 text-gold"
                        >
                          {playing === ayah.global ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                      </div>
                    </div>
                    <p className="font-quran text-[1.5rem] leading-[2.05] break-words text-[var(--text)]" dir="rtl">
                      <ArabicWithAyahEnd text={ayah.arabic} number={ayah.number} />
                    </p>
                  </article>
                )
              })}
            </div>
            {/* RTL page navigation: Left = Next Page (pageNo + 1), Right = Prev Page (pageNo - 1) */}
            <div dir="ltr" className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={loading || pageNo >= 604}
                onClick={() => goPage(pageNo + 1)}
                className="glass inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs disabled:opacity-40"
                aria-label={t('quran.nextPage')}
              >
                <ChevronLeft size={16} />
                <span>{t('quran.nextPage')}</span>
              </button>
              <span className="text-center text-xs text-[var(--muted)]">
                {t('quran.page')} {pageNo} · {t('quran.juz')} {juzFromPage(pageNo)} · {t('quran.hizb')}{' '}
                {mushafFooter(pageNo).hizb}
              </span>
              <button
                type="button"
                disabled={loading || pageNo <= 1}
                onClick={() => goPage(pageNo - 1)}
                className="glass inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs disabled:opacity-40"
                aria-label={t('quran.prevPage')}
              >
                <span>{t('quran.prevPage')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {mode === 'surah' && !activeSurah && (
          <>
            {/* Quick bookmarks strip for 1-click access right from the main view */}
            {bookmarks.length > 0 && (
              <div className="mb-3 rounded-2xl border border-[var(--glass-border)] bg-white/5 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text)]">
                    <Bookmark size={12} className="fill-current text-gold" />
                    {t('quran.bookmarks')} ({bookmarks.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode('bookmarks')}
                    className="text-[10px] text-gold hover:underline"
                  >
                    {t('quran.bookmarks')} →
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {bookmarks.slice(0, 8).map((bm) => {
                    const sMeta = surahs.find((s) => s.n === bm.surah)
                    return (
                      <div
                        key={bm.id}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gold/25 bg-gold/10 px-2 py-1 text-[11px]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openMushafAt(bm.page, {
                              surah: bm.surah,
                              ayah: bm.ayah,
                              highlightKey: bm.id,
                            })
                          }
                          className="inline-flex items-center gap-1 text-left text-[var(--text)]"
                          title={`${t('quran.openInMushaf')} · ${t('quran.page')} ${bm.page}`}
                        >
                          <span className="font-semibold text-gold">{bm.surah}:{bm.ayah}</span>
                          {sMeta && (
                            <span className="max-w-[6.5rem] truncate text-[10px] text-[var(--muted)]">
                              {titleForSurah(sMeta, lang)}
                            </span>
                          )}
                          <span className="rounded bg-white/10 px-1 py-0.2 text-[10px] tabular-nums text-[var(--muted)]">
                            {t('quran.page')} {bm.page}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openBookmarkInSurah(bm)}
                          className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[var(--text)]"
                          title={t('quran.openAyahText')}
                        >
                          {t('quran.ayah')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark(bm.id)}
                          className="ml-0.5 text-[var(--muted)] hover:text-rose-400"
                          aria-label={t('quran.bookmarkRemove')}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
            <ul className="mt-3 max-h-[min(70vh,36rem)] space-y-1 overflow-y-auto">
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
                        {surah.jumpAyah
                          ? `${surah.n}:${surah.jumpAyah}`
                          : `${surah.ayahs} ${t('surah.ayahs')} · ${t('quran.page')} ${SURAH_START_PAGE[surah.n - 1] || 1}`}
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
              <label className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] text-[var(--muted)]">
                <span className="shrink-0">{t('quran.reciter')}</span>
                <select
                  value={reciterId}
                  onChange={(event) => onReciterChange(event.target.value)}
                  className="max-w-[9.5rem] truncate bg-transparent text-[11px] text-[var(--text)] outline-none"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {reciterLabel(r.id, lang)}
                    </option>
                  ))}
                </select>
              </label>
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

            <div className="mb-4 text-center">
              <p className="font-quran text-[1.85rem] leading-relaxed text-[var(--text)]" dir="rtl">
                {meta?.name || ''}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {meta?.englishName} · {t('quran.madani')}
              </p>
              <p className="mt-1 text-[10px] text-[var(--muted)]">{TRANSLATIONS[trLang]?.label}</p>
            </div>

            {loading && <p className="py-8 text-center text-sm text-[var(--muted)]">{t('quran.loading')}</p>}
            {error && <p className="py-4 text-center text-sm text-rose-400">{error}</p>}

            <div ref={listRef} className={`space-y-3 overflow-y-auto ${fullscreen ? 'flex-1 pr-1' : 'max-h-[28rem] pr-1'}`}>
              {ayahs.map((ayah) => {
                const ayahPage = ayah.page || SURAH_START_PAGE[activeSurah - 1] || 1
                const bmKey = `${activeSurah}:${ayah.number}`
                const isBm = bookmarkedMap.has(bmKey)
                return (
                  <article
                    key={ayah.number}
                    data-ayah={ayah.number}
                    className={`rounded-2xl border px-3 py-3 transition ${
                      focusAyah === ayah.number || isBm
                        ? 'border-gold/45 bg-gold/10'
                        : 'border-[var(--glass-border)] bg-white/5'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 tabular-nums text-gold">
                          {activeSurah}:{ayah.number}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openMushafAt(ayahPage, {
                              surah: activeSurah,
                              ayah: ayah.number,
                              highlightKey: bmKey,
                            })
                          }
                          className="rounded-full bg-white/5 px-2 py-0.5 tabular-nums text-[var(--muted)] hover:text-[var(--text)]"
                          title={`${t('quran.openInMushaf')} · ${t('quran.page')} ${ayahPage}`}
                        >
                          {t('quran.page')} {ayahPage}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleBookmark({
                              surah: activeSurah,
                              ayah: ayah.number,
                              page: ayahPage,
                              arabic: ayah.arabic,
                              translation: ayah.translation,
                            })
                          }
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] transition ${
                            isBm ? 'bg-gold/25 text-gold' : 'bg-white/5 text-[var(--muted)] hover:text-gold'
                          }`}
                          aria-label={isBm ? t('quran.bookmarkRemove') : t('quran.bookmarkAdd')}
                          title={isBm ? t('quran.bookmarkAdded') : t('quran.bookmarkAdd')}
                        >
                          <Bookmark size={12} className={isBm ? 'fill-current' : ''} />
                          <span>{isBm ? t('quran.bookmarkAdded') : t('quran.bookmarkAdd')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => playAyah(ayah.global, { surah: activeSurah, ayah: ayah.number })}
                          className="rounded-full bg-gold/15 p-1.5 text-gold"
                        >
                          {playing === ayah.global ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                      </div>
                    </div>
                    <p className="font-quran text-[1.55rem] leading-[2.1] break-words text-[var(--text)]" dir="rtl">
                      <ArabicWithAyahEnd text={ayah.arabic} number={ayah.number} />
                    </p>
                    {showTranslation && ayah.translation && (
                      <p className="mt-2 text-sm leading-relaxed break-words text-[var(--muted)]">
                        {ayah.translation}
                        <span className="mt-1 block text-[10px] opacity-70">{TRANSLATIONS[trLang]?.label}</span>
                      </p>
                    )}
                  </article>
                )
              })}
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
                      {ayahs.map((ayah) => {
                        const ayahPage = ayah.page || SURAH_START_PAGE[activeSurah - 1] || 1
                        const bmKey = `${activeSurah}:${ayah.number}`
                        const isBm = bookmarkedMap.has(bmKey)
                        return (
                          <article
                            key={ayah.number}
                            data-ayah={ayah.number}
                            className={`rounded-2xl border px-3 py-3 ${
                              isBm ? 'border-gold/45 bg-gold/10' : 'border-[var(--glass-border)] bg-white/5'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                              <span>
                                {activeSurah}:{ayah.number} · {t('quran.page')} {ayahPage}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleBookmark({
                                    surah: activeSurah,
                                    ayah: ayah.number,
                                    page: ayahPage,
                                    arabic: ayah.arabic,
                                    translation: ayah.translation,
                                  })
                                }
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] ${
                                  isBm ? 'bg-gold/25 text-gold' : 'bg-white/5 text-[var(--muted)]'
                                }`}
                              >
                                <Bookmark size={12} className={isBm ? 'fill-current' : ''} />
                                {isBm ? t('quran.bookmarkAdded') : t('quran.bookmarkAdd')}
                              </button>
                            </div>
                            <p className="font-quran text-[1.55rem] leading-[2.1] break-words text-[var(--text)]" dir="rtl">
                              <ArabicWithAyahEnd text={ayah.arabic} number={ayah.number} />
                            </p>
                            {showTranslation && ayah.translation && (
                              <p className="mt-2 text-sm text-[var(--muted)]">{ayah.translation}</p>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mushaf Page Ayahs & Bookmarks Sheet */}
            <AnimatePresence>
              {mushafBookmarksOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[115] flex items-end justify-center bg-black/75 p-3 sm:items-center"
                  onClick={() => setMushafBookmarksOpen(false)}
                >
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    onClick={(event) => event.stopPropagation()}
                    className="glass-strong flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-display text-lg text-[var(--text)]">
                          {t('quran.pageAyahsTitle')} · {t('quran.page')} {pageNo}
                        </h4>
                        <p className="text-[11px] text-[var(--muted)]">{t('quran.pageAyahsHint')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMushafBookmarksOpen(false)}
                        className="rounded-full bg-white/10 p-1.5 text-[var(--text)]"
                        aria-label={t('close')}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Quick manual selector for surah + ayah on current page (also works offline) */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--glass-border)] bg-white/5 p-2">
                      <select
                        value={customBmSurah}
                        onChange={(event) => {
                          setCustomBmSurah(Number(event.target.value))
                          setCustomBmAyah(1)
                        }}
                        className="max-w-[9.5rem] flex-1 truncate rounded-xl bg-white/10 px-2 py-1.5 text-xs text-[var(--text)]"
                      >
                        {surahs.map((s) => (
                          <option key={s.n} value={s.n}>
                            {s.n}. {titleForSurah(s, lang)}
                          </option>
                        ))}
                      </select>
                      <label className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2 py-1.5 text-xs text-[var(--text)]">
                        <span className="text-[10px] text-[var(--muted)]">{t('quran.ayah')}</span>
                        <select
                          value={customBmAyah}
                          onChange={(event) => setCustomBmAyah(Number(event.target.value))}
                          className="bg-transparent text-xs text-[var(--text)] outline-none"
                        >
                          {Array.from({ length: selectedCustomSurahMeta?.ayahs || 7 }, (_, idx) => idx + 1).map(
                            (n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const matchAyah = pageAyahs.find(
                            (a) => a.surah === Number(customBmSurah) && a.number === Number(customBmAyah),
                          )
                          handleToggleBookmark({
                            surah: Number(customBmSurah),
                            ayah: Number(customBmAyah),
                            page: pageNo,
                            arabic: matchAyah?.arabic || '',
                          })
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-gold/25 px-2.5 py-1.5 text-xs font-medium text-[var(--text)]"
                      >
                        <Bookmark
                          size={12}
                          className={
                            bookmarkedMap.has(`${customBmSurah}:${customBmAyah}`) ? 'fill-current text-gold' : ''
                          }
                        />
                        {bookmarkedMap.has(`${customBmSurah}:${customBmAyah}`)
                          ? t('quran.bookmarkAdded')
                          : t('quran.customBookmarkAdd')}
                      </button>
                    </div>

                    <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
                      {/* Ayahs on current Mushaf page */}
                      {pageAyahs.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium text-[var(--muted)]">
                            {t('quran.page')} {pageNo} ({pageAyahs.length})
                          </p>
                          {pageAyahs.map((ayah) => {
                            const bmKey = `${ayah.surah}:${ayah.number}`
                            const isBm = bookmarkedMap.has(bmKey)
                            const sMeta = surahs.find((s) => s.n === ayah.surah)
                            return (
                              <div
                                key={ayah.global}
                                className={`rounded-2xl border p-2.5 transition ${
                                  isBm
                                    ? 'border-gold/45 bg-gold/15'
                                    : 'border-[var(--glass-border)] bg-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-[var(--text)]">
                                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gold">
                                      {ayah.surah}:{ayah.number}
                                    </span>{' '}
                                    <span className="text-[11px] text-[var(--muted)]">
                                      {sMeta ? titleForSurah(sMeta, lang) : ''} · {t('quran.page')} {pageNo}
                                    </span>
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleBookmark({
                                          surah: ayah.surah,
                                          ayah: ayah.number,
                                          page: pageNo,
                                          arabic: ayah.arabic,
                                        })
                                      }
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${
                                        isBm
                                          ? 'bg-gold/30 text-gold'
                                          : 'bg-white/10 text-[var(--text)]'
                                      }`}
                                    >
                                      <Bookmark size={12} className={isBm ? 'fill-current' : ''} />
                                      {isBm ? t('quran.bookmarkAdded') : t('quran.bookmarkAdd')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        playAyah(ayah.global, { surah: ayah.surah, ayah: ayah.number })
                                      }
                                      className="rounded-full bg-gold/15 p-1.5 text-gold"
                                    >
                                      {playing === ayah.global ? <Pause size={12} /> : <Play size={12} />}
                                    </button>
                                  </div>
                                </div>
                                <p
                                  className="font-quran mt-1.5 line-clamp-2 text-right text-[1.2rem] leading-[1.9] text-[var(--text)]"
                                  dir="rtl"
                                >
                                  <ArabicWithAyahEnd text={ayah.arabic} number={ayah.number} />
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Saved bookmarks list inside Mushaf modal */}
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-medium text-[var(--muted)]">
                          {t('quran.bookmarks')} ({bookmarks.length})
                        </p>
                        {bookmarks.length === 0 ? (
                          <p className="rounded-2xl bg-white/5 p-3 text-center text-xs text-[var(--muted)]">
                            {t('quran.bookmarksEmpty')}
                          </p>
                        ) : (
                          bookmarks.map((bm) => {
                            const sMeta = surahs.find((s) => s.n === bm.surah)
                            return (
                              <div
                                key={bm.id}
                                className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--glass-border)] bg-white/5 px-3 py-2"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMushafBookmarksOpen(false)
                                    loadMushafPage(bm.page, {
                                      surah: bm.surah,
                                      ayah: bm.ayah,
                                      highlightKey: bm.id,
                                    })
                                  }}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gold">
                                      {bm.surah}:{bm.ayah}
                                    </span>
                                    <span className="text-xs font-medium text-[var(--text)]">
                                      {sMeta ? titleForSurah(sMeta, lang) : ''}
                                    </span>
                                    <span className="text-[11px] text-[var(--muted)]">
                                      · {t('quran.page')} {bm.page}
                                    </span>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openBookmarkInSurah(bm)}
                                  className="rounded-xl bg-white/10 px-2 py-1 text-[10px] text-[var(--text)]"
                                >
                                  {t('quran.openAyahText')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBookmark(bm.id)}
                                  className="rounded-xl bg-white/5 p-1.5 text-[var(--muted)] hover:text-rose-400"
                                  aria-label={t('quran.bookmarkRemove')}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </motion.div>
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
                    className="glass-strong w-full max-w-md rounded-3xl p-5"
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
