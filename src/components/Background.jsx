import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useMouseParallax } from '../hooks/useMouseParallax'

const orbs = [
  {
    className: 'top-[-12%] left-[20%] h-[28rem] w-[28rem]',
    color: 'var(--orb-gold)',
    duration: 22,
    x: [0, 40, -20, 0],
    y: [0, 30, 10, 0],
  },
  {
    className: 'top-[32%] -left-24 h-[22rem] w-[22rem]',
    color: 'var(--orb-emerald)',
    duration: 26,
    x: [0, 30, -15, 0],
    y: [0, -25, 20, 0],
  },
  {
    className: 'top-[58%] right-[-8rem] h-[24rem] w-[24rem]',
    color: 'var(--orb-gold)',
    duration: 24,
    x: [0, -35, 20, 0],
    y: [0, 18, -22, 0],
  },
  {
    className: 'bottom-[-10%] left-[40%] h-[18rem] w-[18rem]',
    color: 'var(--orb-warm)',
    duration: 20,
    x: [0, 18, -28, 0],
    y: [0, -20, 12, 0],
  },
]

function makeStars(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    top: `${(i * 17) % 92}%`,
    delay: (i % 12) * 0.55,
    size: 1 + (i % 3),
    twinkle: 1.8 + (i % 5) * 0.4,
  }))
}

export function Background() {
  const { x, y, scroll } = useMouseParallax()
  const sx = x * 18
  const sy = y * 14 + scroll * 0.06
  const twinkles = useMemo(() => makeStars(32), [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[var(--bg)]" />
      <div className="absolute inset-0 opacity-90" style={{ background: 'var(--skin-overlay)' }} />

      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          style={{
            background: `radial-gradient(circle, ${orb.color}, transparent 68%)`,
            transform: `translate(${sx * 0.08}px, ${sy * 0.06}px)`,
          }}
          animate={{ x: orb.x, y: orb.y }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="absolute inset-0">
        {twinkles.map((star) => (
          <motion.span
            key={`tw-${star.id}`}
            className="absolute rounded-full bg-gold/70 dark:bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              boxShadow: '0 0 6px rgba(212,175,110,0.45)',
            }}
            animate={{ opacity: [0.1, 0.75, 0.15], scale: [0.8, 1.35, 0.85] }}
            transition={{
              duration: star.twinkle,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: star.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
