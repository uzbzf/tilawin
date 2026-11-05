import { ChevronDown, LocateFixed, MapPin } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { cities } from '../data/cities'
import { useGeolocation } from '../hooks/useGeolocation'
import { usePrayerTimes } from '../hooks/usePrayerTimes'
import { DISPLAY_ORDER, formatClock, formatCountdown } from '../lib/prayer'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

export function PrayerWidget() {
  const { t } = useLocale()
  const { click } = useSound()
  const geo = useGeolocation()
  const { schedule } = usePrayerTimes(geo.lat, geo.lng)
  const [openTimes, setOpenTimes] = useState(false)
  const [openCities, setOpenCities] = useState(false)

  const locating = geo.status === 'locating'
  const nextLabel = schedule ? t(`prayer.names.${schedule.nextName}`) : '—'

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-3xl p-5"
      aria-label={t('prayer.next')}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            {t('prayer.next')}
          </p>
          <h2 className="mt-1 truncate font-display text-3xl font-medium text-[var(--text)]">{nextLabel}</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            click()
            geo.locate()
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/5 text-gold transition hover:border-gold/40 hover:shadow-[0_0_20px_var(--glow)]"
          aria-label={t('prayer.locate')}
          title={t('prayer.locate')}
        >
          <LocateFixed size={18} className={locating ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--muted)]">
        {geo.mode === 'geo' && geo.status === 'ready' ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
        ) : (
          <MapPin size={14} className="text-gold" />
        )}
        <span className="truncate">
          {locating ? t('prayer.locating') : geo.label || t('prayer.pickCity')}
        </span>
        {geo.mode === 'geo' && geo.status === 'ready' && (
          <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald">
            {t('prayer.nearby')}
          </span>
        )}
      </div>

      <p className="font-display text-4xl tracking-wide text-gold-bright sm:text-5xl">
        {schedule ? formatCountdown(schedule.remaining) : '—:—:—'}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {schedule
          ? `${t('at')} ${formatClock(schedule.nextTime, schedule.timeZone)}`
          : geo.error || t('prayer.waiting')}
      </p>

      {schedule && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold/50 to-gold"
            animate={{ width: `${Math.round(schedule.progress * 100)}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            click()
            setOpenCities((v) => !v)
          }}
          className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-white/5 px-3 py-2.5 text-left text-sm text-[var(--text)]"
        >
          <span className="text-[var(--muted)]">
            {geo.status === 'denied' ? t('prayer.chooseCity') : t('prayer.otherCity')}
          </span>
          <span className="flex items-center gap-1">
            {geo.mode === 'city' ? geo.label : ''}
            <ChevronDown size={16} className={`transition ${openCities ? 'rotate-180' : ''}`} />
          </span>
        </button>

        <AnimatePresence>
          {openCities && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto rounded-xl p-1">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      click()
                      geo.selectCity(city.id)
                      setOpenCities(false)
                    }}
                    className={`rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      geo.cityId === city.id && geo.mode === 'city'
                        ? 'bg-gold/25 text-gold ring-1 ring-gold/35'
                        : 'bg-white/5 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--text)]'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => {
            click()
            setOpenTimes((v) => !v)
          }}
          className="flex items-center justify-between px-1 py-1 text-xs text-[var(--muted)]"
        >
          {t('prayer.today')}
          <ChevronDown size={14} className={`transition ${openTimes ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {openTimes && schedule && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {DISPLAY_ORDER.map((name) => {
                const stamp = schedule.times[name]
                if (!stamp) return null
                const isNext = name === schedule.nextName
                const isExtra = name === 'sunrise'
                return (
                  <li
                    key={name}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      isNext
                        ? 'bg-gold/10 text-gold'
                        : isExtra
                          ? 'text-[var(--muted)]/90'
                          : 'text-[var(--muted)]'
                    }`}
                  >
                    <span>{t(`prayer.names.${name}`)}</span>
                    <span className="tabular-nums">{formatClock(stamp, schedule.timeZone)}</span>
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
