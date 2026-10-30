import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { site } from '../data/site'
import { useLocale } from '../i18n/LocaleContext'
import { brandIcons } from './BrandIcons'
import { Magnetic } from './Magnetic'

export function SocialLinks() {
  const { t } = useLocale()
  return (
    <section className="space-y-2.5" aria-label={t('socials')}>
      {site.socials.map((social, index) => {
        const Icon = brandIcons[social.id]
        return (
          <motion.div
            key={social.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <Magnetic
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              strength={8}
              className="glass group flex items-center gap-4 rounded-2xl px-4 py-3.5 no-underline transition duration-300 hover:scale-[1.02] hover:border-gold/40 hover:shadow-[0_0_32px_var(--glow)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <Icon size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-medium text-[var(--text)]">{social.label}</span>
                <span className="text-xs text-[var(--muted)]">{social.handle}</span>
              </span>
              <ChevronRight
                size={18}
                className="text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-gold"
              />
            </Magnetic>
          </motion.div>
        )
      })}
    </section>
  )
}
