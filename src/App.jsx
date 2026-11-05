import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Background } from './components/Background'
import { InstallBanner } from './components/InstallBanner'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { SoundToggle } from './components/SoundToggle'
import { TabBar } from './components/TabBar'
import { TelegramMainButton } from './components/TelegramMainButton'
import { ThemeToggle } from './components/ThemeToggle'
import { TelegramProvider, useTelegram } from './hooks/useTelegram'
import { useTheme } from './hooks/useTheme'
import { useLocale } from './i18n/LocaleContext'
import { HabitsScreen } from './screens/HabitsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MediaScreen } from './screens/MediaScreen'
import { PrayerScreen } from './screens/PrayerScreen'
import { VersesScreen } from './screens/VersesScreen'

const screens = {
  home: HomeScreen,
  prayer: PrayerScreen,
  verses: VersesScreen,
  habits: HabitsScreen,
  media: MediaScreen,
}

function AppShell({ theme, toggle }) {
  const { t } = useLocale()
  const { isTelegram } = useTelegram()
  const [tab, setTab] = useState('home')
  const Screen = screens[tab] || HomeScreen

  return (
    <div className="relative min-h-svh">
      <Background />

      <div className="fixed top-[max(0.85rem,calc(env(safe-area-inset-top)+var(--tg-content-top,0px)+0.25rem))] right-[max(0.85rem,calc(env(safe-area-inset-right)+0.35rem))] z-20 flex items-center gap-2">
        <LanguageSwitcher />
        <SoundToggle onLabel={t('soundOn')} offLabel={t('soundOff')} />
        <ThemeToggle theme={theme} onToggle={toggle} lightLabel={t('themeLight')} darkLabel={t('themeDark')} />
      </div>

      <div
        className={`mx-auto flex w-full max-w-md flex-col overflow-x-hidden px-4 pt-[max(4.25rem,calc(env(safe-area-inset-top)+var(--tg-content-top,0px)+3.5rem))] sm:max-w-lg ${
          isTelegram
            ? 'pb-[max(7.5rem,calc(env(safe-area-inset-bottom)+var(--tg-safe-bottom,0px)+6.25rem))]'
            : 'pb-[6.75rem]'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>

      <TabBar active={tab} onChange={setTab} />
      {!isTelegram && <InstallBanner />}
      <TelegramMainButton />
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <TelegramProvider theme={theme}>
      <AppShell theme={theme} toggle={toggle} />
    </TelegramProvider>
  )
}
