import { PrayerWidget } from '../components/PrayerWidget'
import { ReminderToggle } from '../components/ReminderToggle'
import { useLocale } from '../i18n/LocaleContext'

export function PrayerScreen() {
  const { t } = useLocale()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl text-[var(--text)]">{t('tabs.prayer')}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t('prayer.screenHint')}</p>
      </div>
      <PrayerWidget />
      <ReminderToggle />
    </div>
  )
}
