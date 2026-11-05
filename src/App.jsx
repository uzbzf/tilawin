import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Background } from './components/Background'
import { InstallBanner } from './components/InstallBanner'
import { TabBar } from './components/TabBar'
import { TapRipple } from './components/TapRipple'
import { TelegramMainButton } from './components/TelegramMainButton'
import { usePrayerReminderScheduler } from './hooks/usePrayerReminderScheduler'
import { SkinProvider } from './hooks/useSkin'
import { useSound } from './hooks/useSound'
import { TelegramProvider, useTelegram } from './hooks/useTelegram'
import { useTheme } from './hooks/useTheme'
import { HabitsScreen } from './screens/HabitsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MediaScreen } from './screens/MediaScreen'
import { PrayerScreen } from './screens/PrayerScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { VersesScreen } from './screens/VersesScreen'

const screens = {
  home: HomeScreen,
  prayer: PrayerScreen,
  verses: VersesScreen,
  habits: HabitsScreen,
  media: MediaScreen,
  settings: SettingsScreen,
}

function AppShell() {
  const { isTelegram } = useTelegram()
  const { page } = useSound()
  const [tab, setTab] = useState('home')
  const Screen = screens[tab] || HomeScreen
  usePrayerReminderScheduler()

  return (
    <div className="app-shell relative min-h-svh">
      <Background />
      <TapRipple />

      <div
        className={`mx-auto flex w-full max-w-md flex-col overflow-x-hidden px-4 pt-[max(1.25rem,calc(env(safe-area-inset-top)+var(--tg-content-top,0px)+0.75rem))] sm:max-w-lg ${
          isTelegram
            ? 'pb-[max(7.5rem,calc(env(safe-area-inset-bottom)+var(--tg-safe-bottom,0px)+6.25rem))]'
            : 'pb-[6.75rem]'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>

      <TabBar
        active={tab}
        onChange={(next) => {
          page()
          setTab(next)
        }}
      />
      {!isTelegram && <InstallBanner />}
      <TelegramMainButton />
    </div>
  )
}

export default function App() {
  const { theme, isDark } = useTheme()

  return (
    <TelegramProvider theme={theme}>
      <SkinProvider isDark={isDark}>
        <AppShell />
      </SkinProvider>
    </TelegramProvider>
  )
}
