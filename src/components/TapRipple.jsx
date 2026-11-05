import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/** Soft gold ripple on every interactive press */
export function TapRipple() {
  const [ripples, setRipples] = useState([])

  useEffect(() => {
    const onPointer = (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const interactive = target.closest('button, a, [role="button"], [data-tap]')
      if (!interactive) return
      if (interactive.getAttribute('aria-disabled') === 'true' || interactive.hasAttribute('disabled')) return

      const id = `${Date.now()}-${Math.random()}`
      setRipples((list) => [...list.slice(-8), { id, x: event.clientX, y: event.clientY }])
      window.setTimeout(() => {
        setRipples((list) => list.filter((item) => item.id !== id))
      }, 520)
    }

    document.addEventListener('pointerdown', onPointer, { passive: true })
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ opacity: 0.35, scale: 0 }}
            animate={{ opacity: 0, scale: 2.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/35"
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
