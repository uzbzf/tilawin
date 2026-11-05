import { Palette } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useSkin } from '../hooks/useSkin'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

export function SkinPicker() {
  const { t, lang, labelFor } = useLocale()
  const { skins, skinId, setSkin } = useSkin()
  const { click, whoosh } = useSound()
  const [open, setOpen] = useState(false)
  const root = useRef(null)

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
        aria-label={t('appearance.title')}
        onClick={() => {
          click()
          whoosh()
          setOpen((v) => !v)
        }}
        className="glass flex h-11 w-11 items-center justify-center rounded-full text-[var(--text)]"
      >
        <Palette size={17} strokeWidth={1.7} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass absolute top-[calc(100%+0.45rem)] right-0 w-56 rounded-2xl p-2 shadow-[0_18px_40px_var(--glow)]"
          >
            <p className="px-2 pt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
              {t('appearance.title')}
            </p>
            <p className="mb-2 px-2 text-[10px] text-[var(--muted)]">{t('appearance.hint')}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {skins.map((skin) => {
                const selected = skin.id === skinId
                const preview = skin.dark.overlay
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => {
                      click()
                      setSkin(skin.id)
                    }}
                    className={`overflow-hidden rounded-xl border p-2 text-left transition ${
                      selected
                        ? 'border-gold/50 ring-1 ring-gold/30'
                        : 'border-[var(--glass-border)] hover:border-gold/30'
                    }`}
                  >
                    <span
                      className="mb-1.5 block h-8 rounded-lg"
                      style={{ background: preview }}
                    />
                    <span className="block truncate text-[11px] text-[var(--text)]">
                      {labelFor(skin.label) || skin.label[lang] || skin.id}
                    </span>
                    <span className="text-[9px] text-[var(--muted)]">
                      {skin.type === 'gradient' ? t('appearance.gradient') : t('appearance.solid')}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
