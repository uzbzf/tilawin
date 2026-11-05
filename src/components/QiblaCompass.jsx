import { Compass, LocateFixed, Navigation } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

const KAABA = { lat: 21.4225, lng: 39.8262 }

function toRad(deg) {
  return (deg * Math.PI) / 180
}

function toDeg(rad) {
  return (rad * 180) / Math.PI
}

/** Great-circle initial bearing from A → B */
export function qiblaBearing(lat, lng) {
  const φ1 = toRad(lat)
  const φ2 = toRad(KAABA.lat)
  const Δλ = toRad(KAABA.lng - lng)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function normalizeHeading(alpha, absolute, webkitCompass) {
  if (typeof webkitCompass === 'number' && !Number.isNaN(webkitCompass)) {
    return webkitCompass
  }
  if (typeof alpha !== 'number' || Number.isNaN(alpha)) return null
  // absolute: true → alpha is compass degrees from north
  if (absolute) return (360 - alpha) % 360
  return (360 - alpha) % 360
}

export function QiblaCompass() {
  const { t } = useLocale()
  const { click } = useSound()
  const geo = useGeolocation()
  const [heading, setHeading] = useState(null)
  const [perm, setPerm] = useState('unknown')
  const [error, setError] = useState('')

  const qibla = useMemo(() => {
    if (geo.lat == null || geo.lng == null) return null
    return qiblaBearing(geo.lat, geo.lng)
  }, [geo.lat, geo.lng])

  const needle = useMemo(() => {
    if (qibla == null || heading == null) return qibla ?? 0
    return (qibla - heading + 360) % 360
  }, [qibla, heading])

  useEffect(() => {
    const onOrient = (event) => {
      const next = normalizeHeading(
        event.alpha,
        event.absolute,
        event.webkitCompassHeading,
      )
      if (next != null) setHeading(next)
    }

    window.addEventListener('deviceorientationabsolute', onOrient, true)
    window.addEventListener('deviceorientation', onOrient, true)
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrient, true)
      window.removeEventListener('deviceorientation', onOrient, true)
    }
  }, [])

  const requestPermission = async () => {
    click()
    setError('')
    try {
      const DOE = window.DeviceOrientationEvent
      if (DOE && typeof DOE.requestPermission === 'function') {
        const state = await DOE.requestPermission()
        setPerm(state)
        if (state !== 'granted') {
          setError(t('qibla.needPermission'))
        }
      } else {
        setPerm('granted')
      }
    } catch {
      setError(t('qibla.needPermission'))
      setPerm('denied')
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-3xl p-5"
      aria-label={t('qibla.title')}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
            {t('qibla.badge')}
          </p>
          <h3 className="mt-0.5 font-display text-2xl text-[var(--text)]">{t('qibla.title')}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{t('qibla.hint')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            click()
            geo.locate()
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/5 text-gold"
          aria-label={t('prayer.locate')}
        >
          <LocateFixed size={18} className={geo.status === 'locating' ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[var(--glass-border)] bg-white/5 shadow-[inset_0_0_40px_rgba(0,0,0,0.12)]" />
        <div className="absolute inset-3 rounded-full border border-dashed border-gold/30" />
        <span className="absolute top-3 text-[10px] font-semibold tracking-widest text-gold">N</span>
        <span className="absolute bottom-3 text-[10px] text-[var(--muted)]">S</span>
        <span className="absolute left-3 text-[10px] text-[var(--muted)]">W</span>
        <span className="absolute right-3 text-[10px] text-[var(--muted)]">E</span>

        <motion.div
          className="absolute flex h-full w-full items-start justify-center pt-6"
          animate={{ rotate: needle }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <Navigation size={36} className="text-gold drop-shadow-[0_0_12px_var(--glow)]" fill="currentColor" />
        </motion.div>

        <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Compass size={22} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{t('qibla.bearing')}</p>
          <p className="mt-0.5 font-display text-lg text-[var(--text)] tabular-nums">
            {qibla != null ? `${Math.round(qibla)}°` : '—'}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{t('qibla.heading')}</p>
          <p className="mt-0.5 font-display text-lg text-[var(--text)] tabular-nums">
            {heading != null ? `${Math.round(heading)}°` : '—'}
          </p>
        </div>
      </div>

      {(perm !== 'granted' || heading == null) && (
        <button
          type="button"
          onClick={requestPermission}
          className="mt-3 w-full rounded-2xl bg-gold/20 px-3 py-3 text-sm text-[var(--text)]"
        >
          {t('qibla.enable')}
        </button>
      )}

      {(error || geo.error) && (
        <p className="mt-2 text-center text-[11px] text-rose-400">{error || geo.error}</p>
      )}
    </motion.section>
  )
}
