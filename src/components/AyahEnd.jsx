import { stripAyahEnd, toArabicIndic } from '../lib/ayahMark'

/**
 * Ayah number as plain text (no Quran2013 circled glyphs / CSS ring).
 * Size tracks parent Arabic text via em.
 */
export function AyahEnd({ n, className = '' }) {
  const digits = toArabicIndic(n)
  if (!digits) return null
  return (
    <span className={`ayah-end-mark ${className}`.trim()} dir="ltr" aria-label={String(n)}>
      {digits}
    </span>
  )
}

/** Arabic text with one plain ayah number; strips API markers first. */
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
