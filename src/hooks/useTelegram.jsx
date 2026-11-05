import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import {
  applyTelegramChrome,
  applyTelegramThemeParams,
  displayName,
  getTelegramUser,
  initTelegramApp,
  isTelegramWebApp,
  openTelegramChannel,
} from '../lib/telegram'

const TelegramContext = createContext(null)

export function TelegramProvider({ children, theme = 'dark' }) {
  const [isTelegram, setIsTelegram] = useState(() => isTelegramWebApp())
  const [user, setUser] = useState(() => getTelegramUser())
  const [colorScheme, setColorScheme] = useState(() => {
    try {
      return WebApp.colorScheme || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 })
  const [contentSafeArea, setContentSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  const syncInsets = useCallback(() => {
    try {
      const nextSafe = WebApp.safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 }
      const nextContent = WebApp.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 }
      setSafeArea({ ...nextSafe })
      setContentSafeArea({ ...nextContent })
      const root = document.documentElement
      root.style.setProperty('--tg-safe-top', `${nextSafe.top || 0}px`)
      root.style.setProperty('--tg-safe-bottom', `${nextSafe.bottom || 0}px`)
      root.style.setProperty('--tg-safe-left', `${nextSafe.left || 0}px`)
      root.style.setProperty('--tg-safe-right', `${nextSafe.right || 0}px`)
      root.style.setProperty('--tg-content-top', `${nextContent.top || 0}px`)
      root.style.setProperty('--tg-content-bottom', `${nextContent.bottom || 0}px`)
      if (WebApp.viewportStableHeight) {
        root.style.setProperty('--tg-viewport-stable-height', `${WebApp.viewportStableHeight}px`)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const active = initTelegramApp()
    setIsTelegram(active)
    const nextUser = getTelegramUser()
    setUser(nextUser)
    if (active) {
      setColorScheme(WebApp.colorScheme || 'dark')
      syncInsets()
    }
  }, [syncInsets])

  useEffect(() => {
    if (!isTelegram) return undefined
    applyTelegramChrome(theme)
  }, [isTelegram, theme])

  useEffect(() => {
    if (!isTelegram) return undefined

    const onTheme = () => {
      setColorScheme(WebApp.colorScheme || 'dark')
      applyTelegramThemeParams(WebApp.themeParams)
      applyTelegramChrome(theme)
    }
    const onSafe = () => syncInsets()
    const onViewport = () => syncInsets()

    WebApp.onEvent?.('themeChanged', onTheme)
    WebApp.onEvent?.('safeAreaChanged', onSafe)
    WebApp.onEvent?.('contentSafeAreaChanged', onSafe)
    WebApp.onEvent?.('viewportChanged', onViewport)

    return () => {
      WebApp.offEvent?.('themeChanged', onTheme)
      WebApp.offEvent?.('safeAreaChanged', onSafe)
      WebApp.offEvent?.('contentSafeAreaChanged', onSafe)
      WebApp.offEvent?.('viewportChanged', onViewport)
    }
  }, [isTelegram, syncInsets, theme])

  const haptic = useCallback((style = 'light') => {
    try {
      WebApp.HapticFeedback?.impactOccurred?.(style)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      isTelegram,
      user,
      name: displayName(user),
      colorScheme,
      safeArea,
      contentSafeArea,
      webApp: WebApp,
      openChannel: () => openTelegramChannel('https://t.me/tilawin'),
      openContact: () => openTelegramChannel('https://t.me/tilawin7'),
      haptic,
    }),
    [colorScheme, contentSafeArea, haptic, isTelegram, safeArea, user],
  )

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
}

export function useTelegram() {
  const ctx = useContext(TelegramContext)
  if (!ctx) throw new Error('useTelegram must be used within TelegramProvider')
  return ctx
}
