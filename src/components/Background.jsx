import { motion } from 'framer-motion'
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

const stars = [
  { t: '8%', l: '18%', s: 1 },
  { t: '14%', l: '72%', s: 1.4 },
  { t: '22%', l: '40%', s: 1 },
  { t: '31%', l: '88%', s: 1.2 },
  { t: '46%', l: '12%', s: 1 },
  { t: '58%', l: '64%', s: 1.6 },
  { t: '70%', l: '28%', s: 1 },
  { t: '78%', l: '81%', s: 1.3 },
  { t: '86%', l: '50%', s: 1 },
]

export function Background() {
  const { x, y, scroll } = useMouseParallax()
  const sx = x * 18
  const sy = y * 14 + scroll * 0.06

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[var(--bg)]" />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          style={{ background: `radial-gradient(circle, ${orb.color}, transparent 68%)` }}
          animate={{ x: orb.x, y: orb.y }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {stars.map((star, i) => (
        <span
          key={i}
          className="absolute hidden rounded-full bg-white opacity-70 dark:block"
          style={{
            top: star.t,
            left: star.l,
            width: star.s * 2,
            height: star.s * 2,
            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            transform: `translate(${sx * 0.15}px, ${sy * 0.12}px)`,
          }}
        />
      ))}
    </div>
  )
}
