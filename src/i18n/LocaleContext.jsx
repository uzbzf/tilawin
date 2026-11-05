import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getTelegramUser, langFromTelegram } from '../lib/telegram'
import { getLangMeta } from './langs'
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
  const fromTelegram = langFromTelegram(getTelegramUser())
  if (fromTelegram && translations[fromTelegram]) return fromTelegram
  // map common Telegram codes
  const map = { uz: 'ru', uk: 'ru', tr: 'en' }
  if (fromTelegram && map[fromTelegram] && translations[map[fromTelegram]]) return map[fromTelegram]
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
    const meta = getLangMeta(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = meta.dir || 'ltr'
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

  const labelFor = useCallback(
    (item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      return item[lang] || item.ru || item.en || item.ar || ''
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang, t, labelFor, dir: getLangMeta(lang).dir || 'ltr' }),
    [lang, setLang, t, labelFor],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
