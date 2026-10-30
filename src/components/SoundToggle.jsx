import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSound } from '../hooks/useSound'

export function SoundToggle({ onLabel, offLabel }) {
  const { enabled, toggle } = useSound()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? offLabel : onLabel}
      aria-pressed={enabled}
      className="glass relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-[var(--text)] transition hover:border-gold/40 hover:shadow-[0_0_24px_var(--glow)]"
    >
      <motion.span
        key={enabled ? 'on' : 'off'}
        initial={{ rotate: -28, opacity: 0, scale: 0.7 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.24 }}
        className="flex"
      >
        {enabled ? <Volume2 size={18} strokeWidth={1.6} /> : <VolumeX size={18} strokeWidth={1.6} />}
      </motion.span>
    </button>
  )
}
