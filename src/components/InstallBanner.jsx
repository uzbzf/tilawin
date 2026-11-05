import { Download, Share, Smartphone, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

export function InstallBanner() {
  const { t } = useLocale()
  const { click } = useSound()
  const { open, ios, iosHint, install, dismiss } = useInstallPrompt()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-40 px-4 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
        >
          <div className="pointer-events-auto glass-strong mx-auto flex max-w-md items-stretch gap-2 rounded-3xl p-2 pl-3 shadow-[0_12px_40px_var(--glow)]">
            <button
              type="button"
              onClick={() => {
                click()
                install()
              }}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 py-2 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                {ios ? <Share size={18} strokeWidth={1.7} /> : <Download size={18} strokeWidth={1.7} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-snug text-[var(--text)]">
                  {t('install.title')}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted)]">
                  {iosHint ? t('install.ios') : t('install.hint')}
                </span>
              </span>
              <Smartphone size={16} className="hidden shrink-0 text-gold/80 sm:block" />
            </button>
            <button
              type="button"
              onClick={() => {
                click()
                dismiss()
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full text-[var(--muted)] transition hover:bg-white/10 hover:text-[var(--text)]"
              aria-label={t('install.later')}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
