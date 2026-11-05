import { Calculator, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { ASR_METHODS, CALC_METHODS } from '../lib/prayerSettings'
import { usePrayerSettings } from '../hooks/usePrayerSettings'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

function labelFor(item, lang) {
  return item.label[lang] || item.label.en || item.label.ru
}

export function PrayerCalcSettings() {
  const { t, lang } = useLocale()
  const { click } = useSound()
  const { methodId, asrId, setMethodId, setAsrId } = usePrayerSettings()

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-3xl p-5"
      aria-label={t('prayer.calcTitle')}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Calculator size={16} />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg text-[var(--text)]">{t('prayer.calcTitle')}</h3>
          <p className="text-[11px] text-[var(--muted)]">{t('prayer.calcHint')}</p>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          <Calculator size={12} />
          {t('prayer.methodLabel')}
        </span>
        <select
          value={methodId}
          onChange={(event) => {
            click()
            setMethodId(event.target.value)
          }}
          className="w-full appearance-none rounded-2xl border border-[var(--glass-border)] bg-white/10 px-3 py-3 text-sm text-[var(--text)] outline-none backdrop-blur-md focus:border-gold/40"
        >
          {CALC_METHODS.map((method) => (
            <option key={method.id} value={method.id}>
              {labelFor(method, lang)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          <Moon size={12} />
          {t('prayer.asrLabel')}
        </span>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {ASR_METHODS.map((method) => {
            const selected = asrId === method.id
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  click()
                  setAsrId(method.id)
                }}
                className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                  selected
                    ? 'border-gold/40 bg-gold/20 text-[var(--text)]'
                    : 'border-[var(--glass-border)] bg-white/5 text-[var(--muted)] hover:bg-white/10'
                }`}
              >
                {labelFor(method, lang)}
              </button>
            )
          })}
        </div>
      </label>
    </motion.section>
  )
}
