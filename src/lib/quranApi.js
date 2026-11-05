import { stripAyahEnd } from './ayahMark'
import { getReciter, readReciter } from './reciters'

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
    arabic: stripAyahEnd(ayah.text),
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
    arabic: stripAyahEnd(ayah.text),
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

/**
 * Per-ayah audio.
 * Prefer everyayah folders; fall back to islamic.network by global number.
 * @param {number} globalNumber
 * @param {{ surah?: number, ayah?: number, reciterId?: string }} opts
 */
export function audioUrlForAyah(globalNumber, opts = {}) {
  const reciter = getReciter(opts.reciterId || readReciter())
  const surah = Number(opts.surah)
  const ayah = Number(opts.ayah)
  if (reciter.folder && Number.isFinite(surah) && Number.isFinite(ayah) && surah > 0 && ayah > 0) {
    const s = String(surah).padStart(3, '0')
    const a = String(ayah).padStart(3, '0')
    return `https://everyayah.com/data/${reciter.folder}/${s}${a}.mp3`
  }
  if (reciter.islamic && globalNumber) {
    return `https://cdn.islamic.network/quran/audio/128/${reciter.islamic}/${globalNumber}.mp3`
  }
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3`
}
