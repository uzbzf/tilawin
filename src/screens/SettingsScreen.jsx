import { Moon, Sun, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { PrayerCalcSettings } from '../components/PrayerCalcSettings'
import { ReminderSettings } from '../components/ReminderSettings'
import { langs } from '../i18n/langs'
import { useLocale } from '../i18n/LocaleContext'
import { useSkin } from '../hooks/useSkin'
import { useSound } from '../hooks/useSound'
import { useTheme } from '../hooks/useTheme'

export function SettingsScreen() {
  const { t, lang, setLang, labelFor } = useLocale()
  const { theme, toggle: toggleTheme, isDark } = useTheme()
  const { skins, skinId, setSkin } = useSkin()
  const { enabled, toggle: toggleSound, volume, setVolume, click, chime } = useSound()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl text-[var(--text)]">{t('tabs.settings')}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t('settings.hint')}</p>
      </div>

      <PrayerCalcSettings />
      <ReminderSettings />

      <section className="glass rounded-3xl p-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          {t('lang.title')}
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-1.5">
          {langs.map((item) => {
            const selected = item.id === lang
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  click()
                  setLang(item.id)
                }}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                  selected
                    ? 'bg-gold/20 text-[var(--text)] ring-1 ring-gold/30'
                    : 'bg-white/5 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--text)]'
                }`}
              >
                <span className="text-lg leading-none">{item.flag}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
                <span className="text-[10px] opacity-70">{item.short}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="glass rounded-3xl p-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          {t('appearance.title')}
        </h3>
        <p className="mt-1 text-[11px] text-[var(--muted)]">{t('appearance.hint')}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {skins.map((skin) => {
            const selected = skin.id === skinId
            return (
              <button
                key={skin.id}
                type="button"
                onClick={() => {
                  click()
                  setSkin(skin.id)
                }}
                className={`overflow-hidden rounded-2xl border p-2 text-left transition ${
                  selected ? 'border-gold/50 ring-1 ring-gold/30' : 'border-[var(--glass-border)]'
                }`}
              >
                <span className="mb-1.5 block h-10 rounded-xl" style={{ background: skin.dark.overlay }} />
                <span className="block truncate text-[11px] text-[var(--text)]">
                  {labelFor(skin.label)}
                </span>
                <span className="text-[9px] text-[var(--muted)]">
                  {skin.type === 'gradient' ? t('appearance.gradient') : t('appearance.solid')}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="glass rounded-3xl p-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          {t('settings.theme')}
        </h3>
        <button
          type="button"
          onClick={() => {
            click()
            toggleTheme()
          }}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white/5 px-3 py-3"
        >
          <span className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? t('themeLight') : t('themeDark')}
          </span>
          <span className="text-[11px] text-[var(--muted)]">{theme}</span>
        </button>
      </section>

      <section className="glass rounded-3xl p-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
          {t('settings.sound')}
        </h3>
        <button
          type="button"
          onClick={toggleSound}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white/5 px-3 py-3"
        >
          <span className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
            {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {enabled ? t('soundOn') : t('soundOff')}
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-emerald/50' : 'bg-white/10'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                enabled ? 'left-5' : 'left-0.5'
              }`}
            />
          </span>
        </button>

        <label className="mt-4 block">
          <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>{t('settings.volume')}</span>
            <span className="tabular-nums">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            disabled={!enabled}
            onChange={(event) => {
              setVolume(Number(event.target.value) / 100)
            }}
            onPointerUp={() => {
              if (enabled) chime()
            }}
            className="w-full accent-[var(--color-gold)] disabled:opacity-40"
          />
        </label>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-[10px] text-[var(--muted)]"
        >
          {t('settings.volumeHint')}
        </motion.p>
      </section>
    </div>
  )
}
