import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { site } from '../data/site'
import { useCountUp } from '../hooks/useCountUp'
import { formatCount } from '../lib/format'
import { getFollowerCounts } from '../lib/followers'
import { useLocale } from '../i18n/LocaleContext'
import { useSound } from '../hooks/useSound'
import { brandIcons } from './BrandIcons'

function CounterCard({ social, index, count }) {
  const known = typeof count === 'number' && count > 0
  const value = useCountUp(known ? count : 0, 1400 + index * 180)
  const Icon = brandIcons[social.id]
  const { click, hover } = useSound()

  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.28 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={hover}
      onPointerDown={(event) => {
        if (event.button === 0) click()
      }}
      className="glass group flex flex-1 flex-col items-center rounded-2xl px-3 py-4 no-underline transition duration-300 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[0_0_28px_var(--glow)]"
    >
      <div className="mb-2 flex w-full items-center justify-between">
        <span className="text-gold/90">
          <Icon size={16} />
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
          </span>
          Live
        </span>
      </div>
      <p className="font-display text-2xl font-medium tracking-wide text-[var(--text)] sm:text-3xl">
        {known ? formatCount(value) : '—'}
      </p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{social.label}</p>
    </motion.a>
  )
}

export function LiveCounters() {
  const { t } = useLocale()
  const [counts, setCounts] = useState({
    instagram: null,
    telegram: 355,
    tiktok: null,
  })

  useEffect(() => {
    let active = true
    getFollowerCounts()
      .then((next) => {
        if (active && next) setCounts(next)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <section aria-label={t('followers')}>
      <div className="grid grid-cols-3 gap-2.5">
        {site.socials.map((social, index) => (
          <CounterCard key={social.id} social={social} index={index} count={counts[social.id]} />
        ))}
      </div>
    </section>
  )
}
