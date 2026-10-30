import { useEffect, useState } from 'react'

export function useMouseParallax() {
  const [offset, setOffset] = useState({ x: 0, y: 0, scroll: 0 })

  useEffect(() => {
    const onMove = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2
      const y = (event.clientY / window.innerHeight - 0.5) * 2
      setOffset((prev) => ({ ...prev, x, y }))
    }
    const onScroll = () => {
      setOffset((prev) => ({ ...prev, scroll: window.scrollY }))
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return offset
}
