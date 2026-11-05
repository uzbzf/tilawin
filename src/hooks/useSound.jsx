import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getSoundVolume,
  playSound,
  setSoundEnabled,
  setSoundVolume,
  unlockAudio,
} from '../lib/sounds'

const KEY = 'tilawin-sound'
const VOL_KEY = 'tilawin-sound-volume'
const SoundContext = createContext(null)

function readEnabled() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

function readVolume() {
  try {
    const raw = localStorage.getItem(VOL_KEY)
    if (raw == null) return 0.72
    const n = Number(raw)
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n))
  } catch {
    /* ignore */
  }
  return 0.72
}

export function SoundProvider({ children }) {
  const [enabled, setEnabled] = useState(readEnabled)
  const [volume, setVolumeState] = useState(readVolume)

  useEffect(() => {
    setSoundEnabled(enabled)
    try {
      localStorage.setItem(KEY, enabled ? 'on' : 'off')
    } catch {
      /* ignore */
    }
  }, [enabled])

  useEffect(() => {
    setSoundVolume(volume)
    try {
      localStorage.setItem(VOL_KEY, String(volume))
    } catch {
      /* ignore */
    }
  }, [volume])

  useEffect(() => {
    setSoundVolume(getSoundVolume() || volume)
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
    setEnabled(true)
    playSound('click')
  }, [enabled])

  const setVolume = useCallback((next) => {
    const value = Math.min(1, Math.max(0, Number(next) || 0))
    setVolumeState(value)
    setSoundVolume(value)
  }, [])

  const value = useMemo(
    () => ({
      enabled,
      toggle,
      volume,
      setVolume,
      play,
      click: () => playSound('click'),
      tasbeeh: () => playSound('tasbeeh'),
      flip: () => playSound('flip'),
      hover: () => playSound('hover'),
      chime: () => playSound('chime'),
      success: () => playSound('success'),
      whoosh: () => playSound('whoosh'),
      page: () => playSound('page'),
    }),
    [enabled, play, toggle, volume, setVolume],
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound() {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error('useSound must be used within SoundProvider')
  return ctx
}
