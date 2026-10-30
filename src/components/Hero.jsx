import { motion } from 'framer-motion'
import { site } from '../data/site'
import { useLocale } from '../i18n/LocaleContext'

const ease = [0.22, 1, 0.36, 1]

export function Hero() {
  const { t } = useLocale()

  return (
    <header className="flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease }}
        className="relative mb-6"
      >
        <div className="absolute inset-[-22px] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_68%)] blur-md" />
        <div className="relative h-32 w-32 overflow-hidden rounded-full ring-1 ring-black/10 shadow-[0_0_48px_var(--glow)] dark:ring-white/25 sm:h-36 sm:w-36">
          <img src="/avatar.png" alt={site.name} className="h-full w-full object-cover" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease }}
        className="font-display text-[2.55rem] font-medium tracking-[0.38em] text-[var(--text)] sm:text-5xl sm:tracking-[0.42em]"
      >
        TILAWIN
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.22, ease }}
        className="mt-3 max-w-[20rem] px-1 text-[15px] font-light leading-relaxed text-balance text-[var(--muted)]"
      >
        {t('tagline')}
      </motion.p>
    </header>
  )
}
