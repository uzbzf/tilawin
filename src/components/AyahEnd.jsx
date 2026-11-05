import { stripAyahEnd, toArabicIndic } from '../lib/ayahMark'

/**
 * Madani ayah-end mark: U+06DD + Arabic-Indic digits.
 * Quran2013 draws ONE ornamental circle with the number inside.
 * No CSS border — the ring is the glyph itself.
 */
export function AyahEnd({ n, className = '' }) {
  const digits = toArabicIndic(n)
  if (!digits) return null
  return (
    <span className={`ayah-end-mark ${className}`.trim()} dir="rtl" aria-label={String(n)}>
      {`\u06DD${digits}`}
    </span>
  )
}

/** Arabic text + one Madani ayah-end mark (API markers stripped first). */
export function ArabicWithAyahEnd({ text, number, className = '' }) {
  const cleaned = stripAyahEnd(text)
  return (
    <span className={className} dir="rtl">
      {cleaned}
      {cleaned ? '\u00A0' : null}
      <AyahEnd n={number} />
    </span>
  )
}
