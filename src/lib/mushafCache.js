const DB_NAME = 'tilawin-mushaf'
const STORE = 'pages'
const META = 'meta'
const VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getCachedPage(page) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(Number(page))
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function putCachedPage(page, blob, contentType) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ blob, contentType, savedAt: Date.now() }, Number(page))
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function listCachedPages() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAllKeys()
    req.onsuccess = () => resolve((req.result || []).map(Number).sort((a, b) => a - b))
    req.onerror = () => reject(req.error)
  })
}

export async function countCachedPages() {
  const pages = await listCachedPages()
  return pages.length
}

export async function clearMushafCache() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function fetchAndCachePage(page, urls) {
  const cached = await getCachedPage(page)
  if (cached?.blob) {
    return URL.createObjectURL(cached.blob)
  }

  let lastError = null
  for (const url of urls) {
    try {
      const response = await fetch(url, { mode: 'cors' })
      if (!response.ok) continue
      const blob = await response.blob()
      const type = blob.type || response.headers.get('content-type') || 'image/svg+xml'
      await putCachedPage(page, blob, type)
      return URL.createObjectURL(blob)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('Mushaf page fetch failed')
}

export async function downloadPageRange(start, end, getUrls, onProgress) {
  const total = end - start + 1
  let done = 0
  for (let page = start; page <= end; page += 1) {
    const cached = await getCachedPage(page)
    if (!cached?.blob) {
      await fetchAndCachePage(page, getUrls(page))
    }
    done += 1
    onProgress?.({ done, total, page })
  }
  return done
}

export async function blobUrlForPage(page) {
  const cached = await getCachedPage(page)
  if (!cached?.blob) return null
  return URL.createObjectURL(cached.blob)
}

export async function downloadBlob(page) {
  const cached = await getCachedPage(page)
  if (!cached?.blob) return false
  const url = URL.createObjectURL(cached.blob)
  const ext = (cached.contentType || '').includes('svg') ? 'svg' : 'png'
  const a = document.createElement('a')
  a.href = url
  a.download = `mushaf-page-${String(page).padStart(3, '0')}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  return true
}
