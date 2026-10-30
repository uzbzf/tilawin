import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSound } from '../hooks/useSound'

export function ThemeToggle({ theme, onToggle, lightLabel, darkLabel }) {
  const isDark = theme === 'dark'
  const { click } = useSound()

  return (
    <button
      type="button"
      onClick={() => {
        click()
        onToggle()
      }}
      aria-label={isDark ? lightLabel : darkLabel}
      className="glass relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-[var(--text)] transition hover:border-gold/40 hover:shadow-[0_0_24px_var(--glow)]"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -40, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.28 }}
        className="flex"
      >
        {isDark ? <Sun size={18} strokeWidth={1.6} /> : <Moon size={18} strokeWidth={1.6} />}
      </motion.span>
    </button>
  )
}
