import { CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { hijriMonths, islamicEvents } from '../data/islamicEvents'
import { useLocale } from '../i18n/LocaleContext'

function daysBetweenHijri(a, b) {
  const aAbs = a.year * 354 + (a.month - 1) * 29.5 + a.day
  const bAbs = b.year * 354 + (b.month - 1) * 29.5 + b.day
  return Math.round(bAbs - aAbs)
}

export function IslamicCalendar() {
  const { t, lang, labelFor } = useLocale()
  const [hijri, setHijri] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('https://api.aladhan.com/v1/gToH')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const h = json?.data?.hijri
        if (!h) return
        setHijri({
          day: Number(h.day),
          month: Number(h.month.number),
          year: Number(h.year),
          weekday: h.weekday?.en || '',
        })
      })
      .catch(() => {
        if (!cancelled) setHijri(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const monthNames = hijriMonths[lang] || hijriMonths.ru

  const upcoming = useMemo(() => {
    if (!hijri) return []
    const year = hijri.year
    const list = []
    for (const event of islamicEvents) {
      for (const y of [year, year + 1]) {
        const date = { year: y, month: event.month, day: event.day }
        const delta = daysBetweenHijri(hijri, date)
        if (delta >= 0 && delta <= 120) {
          list.push({ ...event, ...date, delta })
        }
      }
    }
    return list.sort((a, b) => a.delta - b.delta).slice(0, 5)
  }, [hijri])

  return (
    <section className="glass overflow-hidden rounded-3xl p-4" aria-label={t('calendar.title')}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <CalendarDays size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl text-[var(--text)]">{t('calendar.title')}</h3>
          <p className="text-[11px] text-[var(--muted)]">{t('calendar.hijri')}</p>
        </div>
      </div>

      {hijri ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-[var(--text)]"
        >
          <span className="block text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            {t('calendar.today')}
          </span>
          <span className="mt-1 block font-display text-2xl">
            {hijri.day} {monthNames[hijri.month - 1]} {hijri.year}
          </span>
        </motion.p>
      ) : (
        <p className="text-sm text-[var(--muted)]">…</p>
      )}

      <p className="mt-4 mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        {t('calendar.upcoming')}
      </p>
      <ul className="space-y-1.5">
        {upcoming.map((event) => (
          <li
            key={`${event.id}-${event.year}`}
            className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate text-[var(--text)]">{labelFor(event.title)}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted)]">
              {event.day} {monthNames[event.month - 1]}
            </span>
          </li>
        ))}
        {!upcoming.length && hijri && (
          <li className="rounded-xl bg-white/5 px-3 py-2 text-xs text-[var(--muted)]">—</li>
        )}
      </ul>
    </section>
  )
}
