import { stripAyahEnd, toArabicIndic } from '../lib/ayahMark'

/** Single ornamental Madani-style ayah end circle (CSS — never doubles). */
export function AyahEnd({ n, className = '' }) {
  const digits = toArabicIndic(n)
  if (!digits) return null
  return (
    <span className={`ayah-end-mark ${className}`.trim()} dir="rtl" aria-label={String(n)}>
      {digits}
    </span>
  )
}

/** Arabic text with one CSS ayah-end mark; strips API markers first. */
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
