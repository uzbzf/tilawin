import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useSound } from '../hooks/useSound'
import { langs, getLangMeta } from '../i18n/langs'
import { useLocale } from '../i18n/LocaleContext'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLocale()
  const { click, whoosh } = useSound()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const current = getLangMeta(lang)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  return (
    <div ref={root} className="relative z-30">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.title')}
        onClick={() => {
          click()
          whoosh()
          setOpen((v) => !v)
        }}
        className="glass flex h-11 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-wide text-[var(--text)]"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span>{current.short}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass absolute top-[calc(100%+0.45rem)] right-0 max-h-72 w-48 overflow-y-auto rounded-2xl p-1.5 shadow-[0_18px_40px_var(--glow)]"
          >
            {langs.map((item) => {
              const selected = item.id === lang
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      click()
                      setLang(item.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                      selected
                        ? 'bg-gold/20 text-[var(--text)]'
                        : 'text-[var(--muted)] hover:bg-white/10 hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="text-base leading-none">{item.flag}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="text-[10px] opacity-70">{item.short}</span>
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
