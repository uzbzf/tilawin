import WebApp from '@twa-dev/sdk'

const DARK_BG = '#000000'
const LIGHT_BG = '#f4efe6'

export function getWebApp() {
  return WebApp
}

export function isTelegramWebApp() {
  try {
    return Boolean(WebApp.initData) || Boolean(WebApp.initDataUnsafe?.user)
  } catch {
    return false
  }
}

export function getTelegramUser() {
  try {
    return WebApp.initDataUnsafe?.user || null
  } catch {
    return null
  }
}

export function displayName(user) {
  if (!user) return ''
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return full || user.username || ''
}

export function langFromTelegram(user) {
  const code = (user?.language_code || '').toLowerCase()
  if (code.startsWith('uz')) return 'uz'
  if (code.startsWith('en')) return 'en'
  if (code.startsWith('ru')) return 'ru'
  return null
}

export function applyTelegramChrome(theme) {
  if (!isTelegramWebApp()) return
  const bg = theme === 'dark' ? DARK_BG : LIGHT_BG
  try {
    if (WebApp.isVersionAtLeast?.('6.1')) {
      WebApp.setHeaderColor(bg)
      WebApp.setBackgroundColor(bg)
    }
    if (WebApp.isVersionAtLeast?.('7.10') && typeof WebApp.setBottomBarColor === 'function') {
      WebApp.setBottomBarColor(bg)
    }
  } catch {
    /* older clients */
  }
}

export function applyTelegramThemeParams(params) {
  if (!params) return
  const root = document.documentElement
  const map = {
    '--tg-bg': params.bg_color,
    '--tg-secondary-bg': params.secondary_bg_color,
    '--tg-text': params.text_color,
    '--tg-hint': params.hint_color,
    '--tg-link': params.link_color,
    '--tg-button': params.button_color,
    '--tg-button-text': params.button_text_color,
    '--tg-header-bg': params.header_bg_color,
    '--tg-accent': params.accent_text_color,
    '--tg-section-bg': params.section_bg_color,
    '--tg-bottom-bar': params.bottom_bar_bg_color,
  }
  Object.entries(map).forEach(([key, value]) => {
    if (value) root.style.setProperty(key, value)
  })
}

export function openTelegramChannel(href = 'https://t.me/tilawin') {
  try {
    if (isTelegramWebApp()) {
      WebApp.openTelegramLink(href)
      return
    }
  } catch {
    /* fall through */
  }
  window.open(href, '_blank', 'noopener,noreferrer')
}

export function initTelegramApp() {
  if (!isTelegramWebApp()) return false
  try {
    WebApp.ready()
    WebApp.expand()
    if (typeof WebApp.disableVerticalSwipes === 'function') {
      WebApp.disableVerticalSwipes()
    }
    applyTelegramThemeParams(WebApp.themeParams)
    document.documentElement.dataset.telegram = '1'
    return true
  } catch {
    return false
  }
}
