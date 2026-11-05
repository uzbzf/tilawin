import { VideoGallery } from '../components/VideoGallery'
import { WallpaperGrid } from '../components/WallpaperGrid'
import { useLocale } from '../i18n/LocaleContext'

export function MediaScreen() {
  const { t } = useLocale()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl text-[var(--text)]">{t('tabs.media')}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t('media.screenHint')}</p>
      </div>
      <WallpaperGrid />
      <VideoGallery />
    </div>
  )
}
