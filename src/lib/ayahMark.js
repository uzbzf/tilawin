const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** Convert Western digits to Arabic-Indic */
export function toArabicIndic(value) {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] || digit)
}

/**
 * Plain-text ornate ayah end for copy/share: ﴿١٢﴾
 * Prefer CSS component `<AyahEnd />` in the UI — avoids empty U+06DD circles.
 */
export function ayahEndMark(number) {
  const digits = toArabicIndic(number)
  return `\uFD3F${digits}\uFD3E`
}

/**
 * Strip every common end-of-ayah / digit / ornate marker so we never stack
 * an empty Madani circle (U+06DD) next to a numbered one.
 */
export function stripAyahEnd(text) {
  let next = String(text || '')
  // Remove ALL U+06DD occurrences (alone or with digits) — empty circle culprit
  next = next.replace(/\u06DD+/g, '')
  next = next.replace(/[\uFD3F﴾]\s*[\u0660-\u0669٠-٩0-9]*\s*[\uFD3E﴿]?/g, '')
  next = next.replace(/[\uFD3E\uFD3F﴾﴿]/g, '')
  // Trailing verse digits (API leftovers after marker removal)
  next = next.replace(/(?:[\s\u200b\u200c\u200d\u200e\u200f\uFEFF]*)[\u0660-\u0669٠-٩0-9]+$/u, '')
  // Collapse spaces / bidi controls
  next = next.replace(/[\u200b\u200c\u200d\u200e\u200f\uFEFF]/g, '')
  return next.replace(/\s+/g, ' ').trim()
}

/** Append a single ornate ayah-end mark (string form — for copy) */
export function withAyahEnd(text, number) {
  const cleaned = stripAyahEnd(text)
  if (!cleaned) return ayahEndMark(number)
  return `${cleaned} ${ayahEndMark(number)}`
}
