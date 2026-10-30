import { Background } from './components/Background'
import { ContactCard } from './components/ContactCard'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { InstallBanner } from './components/InstallBanner'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { LiveCounters } from './components/LiveCounters'
import { MoodVerses } from './components/MoodVerses'
import { PrayerWidget } from './components/PrayerWidget'
import { SocialLinks } from './components/SocialLinks'
import { SoundToggle } from './components/SoundToggle'
import { Tasbeeh } from './components/Tasbeeh'
import { ThemeToggle } from './components/ThemeToggle'
import { VideoGallery } from './components/VideoGallery'
import { useTheme } from './hooks/useTheme'
import { useLocale } from './i18n/LocaleContext'

export default function App() {
  const { theme, toggle } = useTheme()
  const { t } = useLocale()

  return (
    <div className="relative min-h-svh">
      <Background />

      <div className="fixed top-4 right-4 z-20 flex items-center gap-2 sm:top-6 sm:right-6">
        <LanguageSwitcher />
        <SoundToggle onLabel={t('soundOn')} offLabel={t('soundOff')} />
        <ThemeToggle theme={theme} onToggle={toggle} lightLabel={t('themeLight')} darkLabel={t('themeDark')} />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 overflow-x-hidden px-4 pt-16 pb-8 sm:max-w-lg sm:pt-20 sm:pb-10">
        <Hero />
        <PrayerWidget />
        <LiveCounters />
        <MoodVerses />
        <Tasbeeh />
        <SocialLinks />
        <ContactCard />
        <VideoGallery />
        <Footer />
      </div>
      <InstallBanner />
    </div>
  )
}
