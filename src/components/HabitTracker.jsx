import { BookOpen, Check, Flame, Heart, Moon, Sparkles, Sunrise } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { calcStreak, habitDefs, readHabits, todayKey, writeHabits } from '../data/habits'
import { useSound } from '../hooks/useSound'
import { useTelegram } from '../hooks/useTelegram'
import { useLocale } from '../i18n/LocaleContext'

const icons = {
  sunrise: Sunrise,
  book: BookOpen,
  sparkles: Sparkles,
  heart: Heart,
  moon: Moon,
}

export function HabitTracker() {
  const { t } = useLocale()
  const { click } = useSound()
  const { haptic } = useTelegram()
  const [days, setDays] = useState(() => readHabits())
  const day = todayKey()
  const today = days[day] || {}

  useEffect(() => {
    writeHabits(days)
  }, [days])

  const streak = useMemo(() => calcStreak(days), [days])
  const doneCount = habitDefs.filter((habit) => today[habit.id]).length

  const toggle = (id) => {
    click()
    haptic('soft')
    setDays((prev) => {
      const current = { ...(prev[day] || {}) }
      current[id] = !current[id]
      return { ...prev, [day]: current }
    })
  }

  return (
    <section className="glass rounded-3xl p-5" aria-label={t('habits.title')}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            {t('habits.title')}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{t('habits.hint')}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-xs text-gold">
          <Flame size={13} />
          <span className="tabular-nums">{streak}</span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{t('habits.streak')}</span>
        </div>
      </div>

      <p className="mb-3 text-[11px] text-[var(--muted)]">
        {doneCount}/{habitDefs.length} · {t('habits.today')}
      </p>

      <ul className="space-y-2">
        {habitDefs.map((habit) => {
          const Icon = icons[habit.icon] || Sparkles
          const checked = Boolean(today[habit.id])
          return (
            <li key={habit.id}>
              <button
                type="button"
                onClick={() => toggle(habit.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  checked
                    ? 'border-gold/35 bg-gold/12'
                    : 'border-[var(--glass-border)] bg-white/5 hover:bg-white/10'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    checked ? 'bg-gold/20 text-gold' : 'bg-white/5 text-[var(--muted)]'
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {checked ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                      >
                        <Check size={16} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                      >
                        <Icon size={16} strokeWidth={1.7} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--text)]">
                    {t(`habits.items.${habit.id}`)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
