import { ayahEndMark, stripAyahEnd } from '../lib/ayahMark'

/**
 * Madani ayah-end mark in Quran2013 (UthmanicHafs1Ver18):
 * Arabic-Indic digits automatically render inside the ornamental ayah frame via GSUB rlig.
 * Never include U+06DD so no duplicate empty ornament appears next to the number.
 */
export function AyahEnd({ n, className = '' }) {
  if (n == null || n === '') return null
  const mark = ayahEndMark(n)
  if (!mark) return null
  return (
    <span className={`ayah-end-mark ${className}`.trim()} dir="rtl" aria-label={String(n)}>
      {mark}
    </span>
  )
}

/** Arabic text normalized for Madani Mushaf + one single ayah-end mark. */
export function ArabicWithAyahEnd({ text, number, className = '' }) {
  const cleaned = stripAyahEnd(text)
  return (
    <span className={`arabic-with-ayah-end ${className}`.trim()} dir="rtl">
      {cleaned}
      {cleaned && number != null && number !== '' ? '\u00A0' : null}
      <AyahEnd n={number} />
    </span>
  )
}
