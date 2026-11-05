import { juzFromPage, surahFromPage } from '../data/juz'
import { surahs } from '../data/surahs'
import { toArabicIndic } from './ayahMark'

/** Hizb number (1–60) from Madani page approximation */
export function hizbFromPage(page) {
  const p = Math.min(604, Math.max(1, Number(page) || 1))
  return Math.min(60, Math.max(1, Math.ceil(p / 10.067)))
}

export function mushafFooter(page, lang = 'ru') {
  const juz = juzFromPage(page)
  const hizb = hizbFromPage(page)
  const surah = surahs.find((s) => s.n === surahFromPage(page))
  const surahName = surah ? (lang === 'ar' ? surah.ar : surah.ru) : ''
  return {
    page,
    pageAr: toArabicIndic(page),
    juz,
    juzAr: toArabicIndic(juz),
    hizb,
    hizbAr: toArabicIndic(hizb),
    surahName,
    lineAr: `${surahName}  ·  الجزء ${toArabicIndic(juz)}  ·  الحزب ${toArabicIndic(hizb)}  ·  ${toArabicIndic(page)}`,
  }
}
