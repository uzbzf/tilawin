import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { site } from '../data/site'
import { useLocale } from '../i18n/LocaleContext'
import { Magnetic } from './Magnetic'

export function ContactCard() {
  const { t } = useLocale()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Magnetic
        href={site.contact.href}
        target="_blank"
        rel="noopener noreferrer"
        strength={8}
        className="glass-strong group flex items-center gap-4 rounded-2xl px-4 py-4 no-underline transition duration-300 hover:scale-[1.02] hover:border-gold/50"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <MessageCircle size={22} strokeWidth={1.6} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15px] font-medium text-[var(--text)]">{t('contact.label')}</span>
          <span className="text-xs text-[var(--muted)]">
            {t('contact.hint')} · {site.contact.username}
          </span>
        </span>
      </Magnetic>
    </motion.div>
  )
}