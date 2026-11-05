import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSkin, skins } from '../data/skins'

const KEY = 'tilawin-skin'
const SkinContext = createContext(null)

function readSkin() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && skins.some((s) => s.id === saved)) return saved
  } catch {
    /* ignore */
  }
  return 'sand'
}

function applySkin(skinId, isDark) {
  const skin = getSkin(skinId)
  const palette = isDark ? skin.dark : skin.light
  const root = document.documentElement
  root.dataset.skin = skin.id
  root.dataset.skinType = skin.type
  root.style.setProperty('--skin-overlay', palette.overlay)
  root.style.setProperty('--glow', palette.glow)
  root.style.setProperty('--orb-gold', palette.orbGold)
  root.style.setProperty('--orb-emerald', palette.orbEmerald)
  root.style.setProperty('--orb-warm', palette.orbWarm)
  root.style.setProperty('--color-gold', palette.gold)
  root.style.setProperty('--color-gold-bright', palette.goldBright)
}

export function SkinProvider({ children, isDark }) {
  const [skinId, setSkinId] = useState(readSkin)

  useEffect(() => {
    applySkin(skinId, isDark)
    try {
      localStorage.setItem(KEY, skinId)
    } catch {
      /* ignore */
    }
  }, [skinId, isDark])

  const setSkin = useCallback((id) => {
    if (skins.some((s) => s.id === id)) setSkinId(id)
  }, [])

  const value = useMemo(
    () => ({
      skinId,
      setSkin,
      skin: getSkin(skinId),
      skins,
    }),
    [skinId, setSkin],
  )

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>
}

export function useSkin() {
  const ctx = useContext(SkinContext)
  if (!ctx) throw new Error('useSkin must be used within SkinProvider')
  return ctx
}
