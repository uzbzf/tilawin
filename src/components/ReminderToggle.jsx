import { Bell, BellOff, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useSound } from '../hooks/useSound'
import { useTelegram } from '../hooks/useTelegram'
import { useLocale } from '../i18n/LocaleContext'
import { readReminderLocal, setPrayerReminder } from '../lib/remindersApi'
import { getWebApp } from '../lib/telegram'

export function ReminderToggle() {
  const { t } = useLocale()
  const { click } = useSound()
  const { user, haptic, isTelegram } = useTelegram()
  const geo = useGeolocation()
  const [enabled, setEnabled] = useState(() => Boolean(readReminderLocal().enabled))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const toggle = async () => {
    click()
    haptic('medium')
    const next = !enabled
    setBusy(true)
    setMessage('')
    try {
      const result = await setPrayerReminder({
        enabled: next,
        userId: user?.id,
        initData: getWebApp()?.initData || '',
        lat: geo.lat,
        lng: geo.lng,
        city: geo.label,
        offsetMinutes: 15,
      })
      setEnabled(next)
      if (result.offline) {
        setMessage(t('reminders.savedLocal'))
      } else {
        setMessage(next ? t('reminders.on') : t('reminders.off'))
      }
      if (!isTelegram && next) {
        setMessage(t('reminders.needTelegram'))
      }
    } catch {
      setMessage(t('reminders.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="glass rounded-3xl p-4" aria-label={t('reminders.title')}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy || !geo.lat}
        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
          enabled
            ? 'border-emerald/40 bg-emerald/10'
            : 'border-[var(--glass-border)] bg-white/5 hover:bg-white/10'
        } disabled:opacity-60`}
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            enabled ? 'bg-emerald/20 text-emerald' : 'bg-gold/10 text-gold'
          }`}
        >
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : enabled ? <Bell size={18} /> : <BellOff size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-[var(--text)]">{t('reminders.title')}</span>
          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{t('reminders.hint')}</span>
        </span>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? 'bg-emerald/50' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
              enabled ? 'left-5' : 'left-0.5'
            }`}
          />
        </span>
      </button>
      {message && <p className="mt-2 px-1 text-[11px] text-[var(--muted)]">{message}</p>}
    </section>
  )
}
