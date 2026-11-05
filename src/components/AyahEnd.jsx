import { ayahEndMark, stripAyahEnd } from '../lib/ayahMark'

/**
 * Unicode Madani ayah-end: U+06DD + Arabic-Indic digits (Quran2013).
 * API markers are stripped first so only one mark remains.
 */
export function AyahEnd({ n, className = '' }) {
  if (n == null || n === '') return null
  return (
    <span className={`ayah-end-mark ${className}`.trim()} dir="rtl" aria-label={String(n)}>
      {ayahEndMark(n)}
    </span>
  )
}

/** Arabic text + one Unicode ayah-end mark. */
export function ArabicWithAyahEnd({ text, number, className = '' }) {
  const cleaned = stripAyahEnd(text)
  return (
    <span className={`arabic-with-ayah-end ${className}`.trim()} dir="rtl">
      {cleaned}
      {cleaned ? ' ' : null}
      <AyahEnd n={number} />
    </span>
  )
}
