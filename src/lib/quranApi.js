const surahCache = new Map()
const pageCache = new Map()

export function parseAyahRef(query) {
  const match = String(query || '')
    .trim()
    .match(/^(\d{1,3})\s*[:：.]\s*(\d{1,3})$/)
  if (!match) return null
  const surah = Number(match[1])
  const ayah = Number(match[2])
  if (surah < 1 || surah > 114 || ayah < 1) return null
  return { surah, ayah }
}

export const TRANSLATIONS = {
  ru: { id: 'ru.kuliev', label: 'Русский · Кулиев' },
  uz: { id: 'uz.sodik', label: 'Oʻzbekcha · Sodiq' },
}

/** @param {number} surahNumber @param {'ru'|'uz'} translationLang */
export async function fetchSurah(surahNumber, translationLang = 'ru') {
  const n = Number(surahNumber)
  if (!Number.isInteger(n) || n < 1 || n > 114) throw new Error('Invalid surah')
  const tr = TRANSLATIONS[translationLang]?.id || TRANSLATIONS.ru.id
  const key = `${n}:${tr}`
  if (surahCache.has(key)) return surahCache.get(key)

  const url = `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,${tr}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Quran API failed')
  const json = await response.json()
  const editions = Array.isArray(json.data) ? json.data : []
  const uthmani = editions.find((e) => e.edition?.identifier === 'quran-uthmani') || editions[0]
  const translated = editions.find((e) => e.edition?.identifier === tr) || editions[1]

  const ayahs = (uthmani?.ayahs || []).map((ayah, index) => ({
    number: ayah.numberInSurah,
    global: ayah.number,
    arabic: ayah.text,
    translation: translated?.ayahs?.[index]?.text || '',
    juz: ayah.juz,
    page: ayah.page,
  }))

  const result = {
    number: uthmani?.number || n,
    name: uthmani?.name || '',
    englishName: uthmani?.englishName || '',
    englishNameTranslation: uthmani?.englishNameTranslation || '',
    revelationType: uthmani?.revelationType || '',
    translationId: tr,
    ayahs,
  }
  surahCache.set(key, result)
  return result
}

export async function fetchPage(pageNumber) {
  const n = Number(pageNumber)
  if (!Number.isInteger(n) || n < 1 || n > 604) throw new Error('Invalid page')
  if (pageCache.has(n)) return pageCache.get(n)

  const url = `https://api.alquran.cloud/v1/page/${n}/quran-uthmani`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Page API failed')
  const json = await response.json()
  const data = json.data
  const ayahs = (data?.ayahs || []).map((ayah) => ({
    number: ayah.numberInSurah,
    global: ayah.number,
    arabic: ayah.text,
    surah: ayah.surah?.number,
    surahName: ayah.surah?.name,
    surahEn: ayah.surah?.englishName,
    juz: ayah.juz,
    page: ayah.page || n,
  }))

  const result = {
    number: n,
    juz: ayahs[0]?.juz || 1,
    ayahs,
    surahs: data?.surahs || {},
  }
  pageCache.set(n, result)
  return result
}

/** Mishary Alafasy CDN by global ayah number */
export function audioUrlForAyah(globalNumber) {
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3`
}
