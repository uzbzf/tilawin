import { BookOpen, Home, Image, MoonStar, Settings, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

const tabs = [
  { id: 'home', icon: Home, labelKey: 'tabs.home' },
  { id: 'prayer', icon: MoonStar, labelKey: 'tabs.prayer' },
  { id: 'verses', icon: BookOpen, labelKey: 'tabs.verses' },
  { id: 'habits', icon: Sparkles, labelKey: 'tabs.habits' },
  { id: 'media', icon: Image, labelKey: 'tabs.media' },
  { id: 'settings', icon: Settings, labelKey: 'tabs.settings' },
]

export function TabBar({ active, onChange }) {
  const { t } = useLocale()
  const { click } = useSound()

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] sm:px-3"
      aria-label={t('tabs.label')}
    >
      <div className="pointer-events-auto glass-strong mx-auto flex max-w-lg items-stretch gap-0.5 rounded-[1.6rem] p-1.5 shadow-[0_12px_40px_var(--glow)]">
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
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-2 transition ${
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
                <Icon size={16} strokeWidth={selected ? 2 : 1.6} />
                <span className="max-w-full truncate text-[8px] font-medium tracking-wide sm:text-[9px]">
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
