import { useEffect, useRef, useState } from 'react'
import { isIos, isMobileBrowser, isStandalone } from '../lib/pwa'

const KEY = 'tilawin-install-hide'

function wasDismissed() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function useInstallPrompt() {
  const deferred = useRef(null)
  const [open, setOpen] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone() || wasDismissed() || !isMobileBrowser()) return undefined

    setIos(isIos())

    const onPrompt = (event) => {
      event.preventDefault()
      deferred.current = event
      setOpen(true)
    }

    const onInstalled = () => {
      deferred.current = null
      setOpen(false)
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* ignore */
      }
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    const timer = window.setTimeout(() => setOpen(true), 1400)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    document.documentElement.toggleAttribute('data-install-banner', open)
    return () => document.documentElement.removeAttribute('data-install-banner')
  }, [open])

  const dismiss = () => {
    setOpen(false)
    setIosHint(false)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (deferred.current) {
      deferred.current.prompt()
      try {
        const result = await deferred.current.userChoice
        if (result?.outcome === 'accepted') dismiss()
      } catch {
        /* ignore */
      }
      deferred.current = null
      return
    }
    if (isIos()) {
      setIosHint(true)
    }
  }

  return { open, ios, iosHint, install, dismiss }
}
