const CACHE = 'tilawin-v1'

export function registerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => cacheShell())
      .catch(() => {})
  })
}

async function cacheShell() {
  try {
    const cache = await caches.open(CACHE)
    const fromDom = [...document.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="icon"]')]
      .map((node) => node.src || node.href)
      .filter((url) => url && url.startsWith(window.location.origin))
    const urls = ['/', '/index.html', '/manifest.json', '/avatar.png', '/icons/icon-192.png', '/icons/icon-512.png', ...fromDom]
    await Promise.allSettled([...new Set(urls)].map((url) => cache.add(url)))
  } catch {
    /* ignore */
  }
}

export function isStandalone() {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true
    )
  } catch {
    return false
  }
}

export function isMobileBrowser() {
  const ua = navigator.userAgent || ''
  if (/android|iphone|ipad|ipod|mobile|webos|blackberry|iemobile|opera mini/i.test(ua)) {
    return true
  }
  try {
    return window.matchMedia('(max-width: 820px) and (pointer: coarse)').matches
  } catch {
    return false
  }
}

export function isIos() {
  const ua = navigator.userAgent || ''
  if (/iphone|ipad|ipod/i.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}
