import { motion } from 'framer-motion'
import { site } from '../data/site'
import { useTelegram } from '../hooks/useTelegram'
import { useLocale } from '../i18n/LocaleContext'

const ease = [0.22, 1, 0.36, 1]

export function Hero() {
  const { t } = useLocale()
  const { isTelegram, name } = useTelegram()
  const greeting = isTelegram && name ? t('telegram.greeting').replace('{name}', name) : null

  return (
    <header className="flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease }}
        className="relative mb-6"
      >
        <motion.div
          className="absolute inset-[-28px] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_68%)] blur-md"
          animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.96, 1.08, 0.96] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-[-8px] rounded-full border border-gold/25"
          animate={{ opacity: [0.2, 0.65, 0.2], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative h-32 w-32 overflow-hidden rounded-full ring-1 ring-black/10 shadow-[0_0_48px_var(--glow)] dark:ring-white/25 sm:h-36 sm:w-36">
          <img src="/avatar.png" alt={site.name} className="h-full w-full object-cover" />
        </div>
      </motion.div>

      {greeting && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease }}
          className="mb-2 text-[12px] font-medium tracking-[0.14em] text-[var(--muted)] uppercase"
        >
          {greeting}
        </motion.p>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease }}
        className="max-w-full px-2 font-display text-[2.2rem] font-medium tracking-[0.28em] text-[var(--text)] sm:text-5xl sm:tracking-[0.36em]"
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
