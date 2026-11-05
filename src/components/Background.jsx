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
    delay: (i % 12) * 0.55,
    duration: 7 + (i % 8) * 1.1,
    size: 1 + (i % 3),
    drift: ((i * 13) % 40) - 20,
    twinkle: 1.6 + (i % 5) * 0.35,
  }))
}

export function Background() {
  const { x, y, scroll } = useMouseParallax()
  const sx = x * 18
  const sy = y * 14 + scroll * 0.06
  const falling = useMemo(() => makeStars(16), [])
  const twinkles = useMemo(() => makeStars(28), [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[var(--bg)]" />
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

      {/* Soft twinkles — visible in light & dark */}
      <div className="absolute inset-0">
        {twinkles.map((star) => (
          <motion.span
            key={`tw-${star.id}`}
            className="absolute rounded-full bg-gold/70 dark:bg-white"
            style={{
              top: `${(star.id * 17) % 92}%`,
              left: star.left,
              width: star.size,
              height: star.size,
              boxShadow: '0 0 6px rgba(212,175,110,0.45)',
            }}
            animate={{ opacity: [0.08, 0.55, 0.12], scale: [0.75, 1.25, 0.8] }}
            transition={{ duration: star.twinkle, repeat: Infinity, ease: 'easeInOut', delay: star.delay }}
          />
        ))}

        {falling.map((star) => (
          <motion.span
            key={`fall-${star.id}`}
            className="absolute bg-gradient-to-b from-gold/80 to-transparent dark:from-white/90"
            style={{
              left: star.left,
              width: star.size + 0.5,
              height: star.size * 10,
              borderRadius: 999,
              boxShadow: '0 0 8px rgba(212,175,110,0.35)',
              rotate: '18deg',
            }}
            initial={{ top: '-8%', opacity: 0 }}
            animate={{
              top: ['-8%', '110%'],
              x: [0, star.drift],
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: star.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
