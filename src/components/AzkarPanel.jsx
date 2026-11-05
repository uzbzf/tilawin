import { Check, Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { azkarSets } from '../data/azkar'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

export function AzkarPanel() {
  const { t, labelFor } = useLocale()
  const { click, success, chime } = useSound()
  const [mode, setMode] = useState('morning')
  const [progress, setProgress] = useState({})

  const list = useMemo(() => azkarSets[mode] || [], [mode])

  const bump = (item) => {
    const key = `${mode}:${item.id}`
    const current = progress[key] || 0
    if (current >= item.count) {
      click()
      return
    }
    const next = current + 1
    setProgress((map) => ({ ...map, [key]: next }))
    if (next >= item.count) {
      success()
      chime()
    } else {
      click()
    }
  }

  return (
    <section className="glass overflow-hidden rounded-3xl p-4" aria-label={t('azkar.title')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-xl text-[var(--text)]">{t('azkar.title')}</h3>
        <div className="flex rounded-full bg-white/5 p-1">
          {[
            { id: 'morning', icon: Sun, label: t('azkar.morning') },
            { id: 'evening', icon: Moon, label: t('azkar.evening') },
          ].map((tab) => {
            const Icon = tab.icon
            const selected = mode === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  click()
                  setMode(tab.id)
                }}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] transition ${
                  selected ? 'bg-gold/20 text-[var(--text)]' : 'text-[var(--muted)]'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <ul className="space-y-2">
        <AnimatePresence mode="popLayout">
          {list.map((item) => {
            const key = `${mode}:${item.id}`
            const current = progress[key] || 0
            const done = current >= item.count
            return (
              <motion.li
                key={key}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <button
                  type="button"
                  onClick={() => bump(item)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    done
                      ? 'border-emerald/35 bg-emerald/10'
                      : 'border-[var(--glass-border)] bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="font-display text-lg leading-relaxed break-words text-[var(--text)]" dir="rtl">
                    {item.arabic}
                  </p>
                  <p className="mt-1.5 text-xs leading-snug break-words text-[var(--muted)]">
                    {labelFor(item.text) || item.text.ru}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
                    <span>
                      {Math.min(current, item.count)} / {item.count} {t('azkar.times')}
                    </span>
                    {done && (
                      <span className="inline-flex items-center gap-1 text-emerald">
                        <Check size={12} />
                        {t('azkar.done')}
                      </span>
                    )}
                  </div>
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </section>
  )
}
