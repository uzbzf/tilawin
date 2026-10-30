import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

const KEY = 'tilawin-lang'
const LocaleContext = createContext(null)

function readLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && translations[saved]) return saved
  } catch {
    /* ignore */
  }
  return 'ru'
}

function lookup(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), dict)
}

export function LocaleProvider({ children }) {
  const [lang, setLangState] = useState(readLang)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang === 'uz' ? 'uz' : lang
  }, [lang])

  const setLang = useCallback((next) => {
    if (translations[next]) setLangState(next)
  }, [])

  const t = useCallback(
    (path) => {
      const value = lookup(translations[lang], path)
      if (value != null && typeof value !== 'object') return value
      return lookup(translations.ru, path) || path
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
