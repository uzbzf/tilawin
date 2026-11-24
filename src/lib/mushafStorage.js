import { juzFromPage, SURAH_START_PAGE, surahFromPage } from '../data/juz'
import { stripAyahEnd } from './ayahMark'
import { getMushafMeta, putMushafMeta } from './mushafCache'
import { getWebApp, isTelegramWebApp } from './telegram'

const PROGRESS_KEY = 'tilawin-mushaf-progress'
const BOOKMARKS_KEY = 'tilawin-quran-bookmarks'

function clampPage(page) {
  const n = Number(page)
  if (!Number.isFinite(n)) return 1
  return Math.min(604, Math.max(1, Math.round(n)))
}

function clampSurah(surah, fallbackPage = 1) {
  const n = Number(surah)
  if (Number.isInteger(n) && n >= 1 && n <= 114) return n
  return surahFromPage(fallbackPage)
}

export function normalizeProgress(raw) {
  if (!raw || typeof raw !== 'object') return null
  const page = clampPage(raw.page)
  if (!raw.page || Number(raw.page) < 1) return null
  const surah = clampSurah(raw.surah, page)
  const ayahNum = Number(raw.ayah)
  const ayah = Number.isInteger(ayahNum) && ayahNum >= 1 ? ayahNum : null
  const juz = juzFromPage(page)
  const mode = ['mushaf', 'page', 'surah'].includes(raw.mode) ? raw.mode : 'mushaf'
  const updatedAt = Number(raw.updatedAt) || Date.now()
  return { page, surah, ayah, juz, mode, updatedAt }
}

function writeCloudItem(key, value) {
  try {
    if (!isTelegramWebApp()) return
    const webApp = getWebApp()
    if (webApp?.isVersionAtLeast?.('6.9') && webApp?.CloudStorage?.setItem) {
      webApp.CloudStorage.setItem(key, JSON.stringify(value), () => {})
    }
  } catch {
    /* ignore */
  }
}

function readCloudItem(key) {
  return new Promise((resolve) => {
    try {
      if (!isTelegramWebApp()) {
        resolve(null)
        return
      }
      const webApp = getWebApp()
      if (!webApp?.isVersionAtLeast?.('6.9') || !webApp?.CloudStorage?.getItem) {
        resolve(null)
        return
      }
      webApp.CloudStorage.getItem(key, (err, val) => {
        if (err || !val) {
          resolve(null)
          return
        }
        try {
          resolve(JSON.parse(val))
        } catch {
          resolve(null)
        }
      })
    } catch {
      resolve(null)
    }
  })
}

export function readLastProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return null
    return normalizeProgress(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeLastProgress(patch) {
  const prev = readLastProgress()
  const merged = normalizeProgress({
    ...prev,
    ...patch,
    updatedAt: Date.now(),
  })
  if (!merged) return null
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged))
  } catch {
    /* ignore */
  }
  putMushafMeta(PROGRESS_KEY, merged).catch(() => {})
  writeCloudItem(PROGRESS_KEY, merged)
  return merged
}

export async function hydrateProgressAsync() {
  const local = readLastProgress()
  let best = local

  try {
    const idb = normalizeProgress(await getMushafMeta(PROGRESS_KEY))
    if (idb && (!best || idb.updatedAt > best.updatedAt)) {
      best = idb
    }
  } catch {
    /* ignore */
  }

  try {
    const cloud = normalizeProgress(await readCloudItem(PROGRESS_KEY))
    if (cloud && (!best || cloud.updatedAt > best.updatedAt)) {
      best = cloud
    }
  } catch {
    /* ignore */
  }

  if (best && (!local || best.updatedAt > local.updatedAt || best.page !== local.page)) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(best))
    } catch {
      /* ignore */
    }
  }
  return best
}

export function normalizeBookmark(raw) {
  if (!raw || typeof raw !== 'object') return null
  const surah = Number(raw.surah)
  const ayah = Number(raw.ayah)
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null
  if (!Number.isInteger(ayah) || ayah < 1) return null
  const fallbackPage = SURAH_START_PAGE[surah - 1] || 1
  const page = raw.page ? clampPage(raw.page) : fallbackPage
  const juz = juzFromPage(page)
  const id = `${surah}:${ayah}`
  const arabic = typeof raw.arabic === 'string' ? stripAyahEnd(raw.arabic).slice(0, 260) : ''
  const translation = typeof raw.translation === 'string' ? raw.translation.slice(0, 260) : ''
  const createdAt = Number(raw.createdAt) || Date.now()
  return {
    id,
    surah,
    ayah,
    page,
    juz,
    arabic,
    translation,
    createdAt,
  }
}

export function readBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set()
    const list = []
    for (const item of parsed) {
      const norm = normalizeBookmark(item)
      if (norm && !seen.has(norm.id)) {
        seen.add(norm.id)
        list.push(norm)
      }
    }
    return list.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export function writeBookmarks(list) {
  const seen = new Set()
  const normalized = []
  for (const item of Array.isArray(list) ? list : []) {
    const norm = normalizeBookmark(item)
    if (norm && !seen.has(norm.id)) {
      seen.add(norm.id)
      normalized.push(norm)
    }
  }
  normalized.sort((a, b) => b.createdAt - a.createdAt)
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(normalized))
  } catch {
    /* ignore */
  }
  putMushafMeta(BOOKMARKS_KEY, normalized).catch(() => {})
  writeCloudItem(BOOKMARKS_KEY, normalized)
  return normalized
}

export function toggleAyahBookmark(entry) {
  const norm = normalizeBookmark({ ...entry, createdAt: Date.now() })
  if (!norm) return { bookmarks: readBookmarks(), added: false, item: null }
  const current = readBookmarks()
  const exists = current.some((b) => b.id === norm.id)
  if (exists) {
    const next = writeBookmarks(current.filter((b) => b.id !== norm.id))
    return { bookmarks: next, added: false, item: norm }
  }
  const next = writeBookmarks([norm, ...current])
  return { bookmarks: next, added: true, item: norm }
}

export function removeAyahBookmark(id) {
  const current = readBookmarks()
  return writeBookmarks(current.filter((b) => b.id !== String(id)))
}

export async function hydrateBookmarksAsync() {
  const local = readBookmarks()
  if (local.length > 0) return local

  try {
    const idb = await getMushafMeta(BOOKMARKS_KEY)
    if (Array.isArray(idb) && idb.length > 0) {
      return writeBookmarks(idb)
    }
  } catch {
    /* ignore */
  }

  try {
    const cloud = await readCloudItem(BOOKMARKS_KEY)
    if (Array.isArray(cloud) && cloud.length > 0) {
      return writeBookmarks(cloud)
    }
  } catch {
    /* ignore */
  }

  return local
}
