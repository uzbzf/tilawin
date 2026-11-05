const cache = new Map()

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

/** Madani Uthmani + Kuliev RU via alquran.cloud (quran.com-compatible text) */
export async function fetchSurah(surahNumber) {
  const n = Number(surahNumber)
  if (!Number.isInteger(n) || n < 1 || n > 114) throw new Error('Invalid surah')
  if (cache.has(n)) return cache.get(n)

  const url = `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,ru.kuliev`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Quran API failed')
  const json = await response.json()
  const editions = Array.isArray(json.data) ? json.data : []
  const uthmani = editions.find((e) => e.edition?.identifier === 'quran-uthmani') || editions[0]
  const kuliev = editions.find((e) => e.edition?.identifier === 'ru.kuliev') || editions[1]

  const ayahs = (uthmani?.ayahs || []).map((ayah, index) => ({
    number: ayah.numberInSurah,
    arabic: ayah.text,
    translation: kuliev?.ayahs?.[index]?.text || '',
    juz: ayah.juz,
    page: ayah.page,
  }))

  const result = {
    number: uthmani?.number || n,
    name: uthmani?.name || '',
    englishName: uthmani?.englishName || '',
    englishNameTranslation: uthmani?.englishNameTranslation || '',
    revelationType: uthmani?.revelationType || '',
    ayahs,
  }
  cache.set(n, result)
  return result
}
