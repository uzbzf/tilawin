export const langs = [
  { id: 'ar', label: 'العربية', short: 'AR', flag: '🇸🇦', dir: 'rtl' },
  { id: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺', dir: 'ltr' },
  { id: 'en', label: 'English', short: 'EN', flag: '🇬🇧', dir: 'ltr' },
  { id: 'kk', label: 'Қазақша', short: 'KK', flag: '🇰🇿', dir: 'ltr' },
  { id: 'ky', label: 'Кыргызча', short: 'KY', flag: '🇰🇬', dir: 'ltr' },
  { id: 'tg', label: 'Тоҷикӣ', short: 'TG', flag: '🇹🇯', dir: 'ltr' },
  { id: 'tt', label: 'Татарча', short: 'TT', flag: '☪', dir: 'ltr' },
  { id: 'ce', label: 'Нохчийн', short: 'CE', flag: '☪', dir: 'ltr' },
]

export function getLangMeta(id) {
  return langs.find((l) => l.id === id) || langs[1]
}
