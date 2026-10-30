import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSound } from '../hooks/useSound'

export function Magnetic({
  children,
  className = '',
  strength = 10,
  href,
  onMouseMove,
  onMouseLeave,
  onMouseEnter,
  onPointerDown,
  ...props
}) {
  const [delta, setDelta] = useState({ x: 0, y: 0 })
  const { hover, click } = useSound()
  const Tag = href ? motion.a : motion.div

  return (
    <Tag
      href={href}
      className={className}
      animate={{ x: delta.x, y: delta.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.6 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setDelta({
          x: ((event.clientX - rect.left) / rect.width - 0.5) * strength,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * strength,
        })
        onMouseMove?.(event)
      }}
      onMouseLeave={(event) => {
        setDelta({ x: 0, y: 0 })
        onMouseLeave?.(event)
      }}
      onMouseEnter={(event) => {
        hover()
        onMouseEnter?.(event)
      }}
      onPointerDown={(event) => {
        if (event.button === 0) click()
        onPointerDown?.(event)
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}
