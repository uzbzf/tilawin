const KEY = 'tilawin-reciter'

/**
 * everyayah.com folders — reliable per-ayah mp3 for chosen qaris.
 * URL: https://everyayah.com/data/{folder}/{SSS}{AAA}.mp3
 */
export const RECITERS = [
  {
    id: 'husary',
    folder: 'Husary_128kbps',
    label: { ru: 'Махмуд аль-Хусари', en: 'Mahmoud Al-Husary', ar: 'محمود الخصري' },
  },
  {
    id: 'shatri',
    folder: 'Abu_Bakr_Ash-Shaatree_128kbps',
    label: { ru: 'Абу Бакр аш-Шатри', en: 'Abu Bakr ash-Shatri', ar: 'أبو بكر الشاطري' },
  },
  {
    id: 'luhaidan',
    folder: 'Muhammad_Al_Luhaidan_128kbps',
    label: { ru: 'Мухаммад аль-Люхайдан', en: 'Muhammad Al-Luhaidan', ar: 'محمد اللحيدان' },
  },
  {
    id: 'dosari',
    folder: 'Yasser_Ad-Dussary_128kbps',
    label: { ru: 'Ясир ад-Даусари', en: 'Yasser Al-Dosari', ar: 'ياسر الدوسري' },
  },
  {
    id: 'muaiqly',
    folder: 'Maher_AlMuaiqly_64kbps',
    label: { ru: 'Махир Аль-Муайкли', en: 'Maher Al-Muaiqly', ar: 'ماهر المعيقلي' },
  },
  {
    id: 'alafasy',
    folder: 'Alafasy_128kbps',
    islamic: 'ar.alafasy',
    label: { ru: 'Мишари Рашид Аляфасы', en: 'Mishary Alafasy', ar: 'مشاري العفاسي' },
  },
]

export function readReciter() {
  try {
    const id = localStorage.getItem(KEY)
    if (RECITERS.some((r) => r.id === id)) return id
  } catch {
    /* ignore */
  }
  return 'husary'
}

export function writeReciter(id) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
}

export function reciterLabel(id, lang = 'ru') {
  const item = RECITERS.find((r) => r.id === id) || RECITERS[0]
  return item.label[lang] || item.label.en || item.label.ru
}

export function getReciter(id = readReciter()) {
  return RECITERS.find((r) => r.id === id) || RECITERS[0]
}
