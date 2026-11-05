import { AzkarPanel } from '../components/AzkarPanel'
import { IslamicCalendar } from '../components/IslamicCalendar'
import { PrayerWidget } from '../components/PrayerWidget'
import { QiblaCompass } from '../components/QiblaCompass'
import { TahajjudCard } from '../components/TahajjudCard'
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
      <QiblaCompass />
      <TahajjudCard />
      <AzkarPanel />
      <IslamicCalendar />
    </div>
  )
}
