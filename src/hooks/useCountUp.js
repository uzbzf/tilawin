import { useEffect, useState } from 'react'

export function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const startValue = 0
    const start = performance.now()
    let frame

    const tick = (ts) => {
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - (1 - p) ** 3
      setValue(Math.round(startValue + (target - startValue) * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
