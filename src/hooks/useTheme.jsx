import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getWebApp, isTelegramWebApp } from '../lib/telegram'

const KEY = 'tilawin-theme'
const ThemeContext = createContext(null)

function readTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  try {
    if (isTelegramWebApp() && getWebApp().colorScheme === 'light') return 'light'
  } catch {
    /* ignore */
  }
  return 'dark'
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const color = theme === 'dark' ? '#0f172a' : '#f4efe6'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', color)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggle, isDark: theme === 'dark' }),
    [theme, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
