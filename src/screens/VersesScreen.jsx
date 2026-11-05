import { MoodVerses } from '../components/MoodVerses'
import { SurahSearch } from '../components/SurahSearch'
import { useLocale } from '../i18n/LocaleContext'

export function VersesScreen() {
  const { t } = useLocale()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl text-[var(--text)]">{t('tabs.verses')}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t('mood.screenHint')}</p>
      </div>
      <SurahSearch />
      <MoodVerses showSearch />
    </div>
  )
}
