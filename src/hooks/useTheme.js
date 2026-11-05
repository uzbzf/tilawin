import { useCallback, useEffect, useState } from 'react'
import { getWebApp, isTelegramWebApp } from '../lib/telegram'

const KEY = 'tilawin-theme'

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

export function useTheme() {
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

  return { theme, setTheme, toggle, isDark: theme === 'dark' }
}
