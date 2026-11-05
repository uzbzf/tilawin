import { stripAyahEnd, toArabicIndic } from '../lib/ayahMark'

/**
 * ONE ayah-end mark: CSS circle + digit.
 * Do not use U+06DD — Quran2013 draws an empty circle for it, causing a double icon.
 * Digits use sans so the Quran font does not add a second circled glyph.
 */
export function AyahEnd({ n, className = '' }) {
  const digits = toArabicIndic(n)
  if (!digits) return null
  return (
    <span className={`ayah-end-mark ${className}`.trim()} dir="rtl" aria-label={String(n)}>
      {digits}
    </span>
  )
}

/** Arabic text + single ayah-end mark (API markers stripped first). */
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
