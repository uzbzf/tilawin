import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { playSound, setSoundEnabled, unlockAudio } from '../lib/sounds'

const KEY = 'tilawin-sound'
const SoundContext = createContext(null)

function readEnabled() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function SoundProvider({ children }) {
  const [enabled, setEnabled] = useState(readEnabled)

  useEffect(() => {
    setSoundEnabled(enabled)
    try {
      localStorage.setItem(KEY, enabled ? 'on' : 'off')
    } catch {
      /* ignore */
    }
  }, [enabled])

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const play = useCallback((kind) => {
    playSound(kind)
  }, [])

  const toggle = useCallback(() => {
    if (enabled) {
      playSound('click')
      setSoundEnabled(false)
      setEnabled(false)
      return
    }
    setSoundEnabled(true)
    playSound('click')
    setEnabled(true)
  }, [enabled])

  const value = useMemo(
    () => ({
      enabled,
      toggle,
      play,
      click: () => playSound('click'),
      tasbeeh: () => playSound('tasbeeh'),
      flip: () => playSound('flip'),
      hover: () => playSound('hover'),
    }),
    [enabled, play, toggle],
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound() {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error('useSound must be used within SoundProvider')
  return ctx
}
