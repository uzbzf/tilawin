import { BookOpen, Home, Image, MoonStar, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

const tabs = [
  { id: 'home', icon: Home, labelKey: 'tabs.home' },
  { id: 'prayer', icon: MoonStar, labelKey: 'tabs.prayer' },
  { id: 'verses', icon: BookOpen, labelKey: 'tabs.verses' },
  { id: 'habits', icon: Sparkles, labelKey: 'tabs.habits' },
  { id: 'media', icon: Image, labelKey: 'tabs.media' },
]

export function TabBar({ active, onChange }) {
  const { t } = useLocale()
  const { click } = useSound()

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))]"
      aria-label={t('tabs.label')}
    >
      <div className="pointer-events-auto glass-strong mx-auto flex max-w-md items-stretch gap-0.5 rounded-[1.6rem] p-1.5 shadow-[0_12px_40px_var(--glow)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const selected = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === active) return
                click()
                onChange(tab.id)
              }}
              data-tap
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 transition ${
                selected ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              aria-current={selected ? 'page' : undefined}
            >
              {selected && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-2xl bg-gold/15 ring-1 ring-gold/25"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon size={18} strokeWidth={selected ? 2 : 1.6} />
                <span className="max-w-[4.2rem] truncate text-[9px] font-medium tracking-wide">
                  {t(tab.labelKey)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
