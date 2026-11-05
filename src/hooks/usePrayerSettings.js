import { useCallback, useEffect, useState } from 'react'
import {
  readAsrMadhab,
  readCalcMethod,
  writeAsrMadhab,
  writeCalcMethod,
} from '../lib/prayerSettings'

const EVENT = 'tilawin-prayer-settings'

export function usePrayerSettings() {
  const [methodId, setMethodIdState] = useState(() => readCalcMethod())
  const [asrId, setAsrIdState] = useState(() => readAsrMadhab())

  useEffect(() => {
    const sync = () => {
      setMethodIdState(readCalcMethod())
      setAsrIdState(readAsrMadhab())
    }
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setMethodId = useCallback((id) => {
    writeCalcMethod(id)
    setMethodIdState(id)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  const setAsrId = useCallback((id) => {
    writeAsrMadhab(id)
    setAsrIdState(id)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { methodId, asrId, setMethodId, setAsrId }
}
