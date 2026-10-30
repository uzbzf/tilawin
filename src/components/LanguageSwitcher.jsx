import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'

const langs = [
  { id: 'ru', label: 'RU' },
  { id: 'uz', label: 'UZ' },
  { id: 'en', label: 'EN' },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useLocale()
  const { click } = useSound()

  return (
    <div className="glass flex rounded-full p-1" role="group" aria-label="Language">
      {langs.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            if (item.id !== lang) click()
            setLang(item.id)
          }}
          className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition ${
            lang === item.id
              ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
