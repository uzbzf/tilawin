const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** Convert Western digits to Arabic-Indic */
export function toArabicIndic(value) {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] || digit)
}

/**
 * Plain-text ayah number for copy/share — never U+06DD / ornate glyphs.
 */
export function ayahEndMark(number) {
  return `(${toArabicIndic(number)})`
}

/**
 * Strip every end-of-ayah / ornate / trailing digit marker so we never
 * stack an empty Madani circle next to our mark.
 */
export function stripAyahEnd(text) {
  let next = String(text || '')
  // Empty / filled end-of-ayah (alone or with digits) — anywhere
  next = next.replace(/\u06DD+/g, '')
  next = next.replace(/[\uFD3F﴾]\s*[\u0660-\u0669٠-٩0-9]*\s*[\uFD3E﴿]?/g, '')
  next = next.replace(/[\uFD3E\uFD3F﴾﴿]/g, '')
  // Trailing verse numbers left after marker strip
  next = next.replace(/(?:[\s\u200b\u200c\u200d\u200e\u200f\uFEFF]*)[\u0660-\u0669٠-٩0-9]+$/u, '')
  next = next.replace(/[\u200b\u200c\u200d\u200e\u200f\uFEFF]/g, '')
  return next.replace(/\s+/g, ' ').trim()
}

/** Append ayah number for plain-text copy */
export function withAyahEnd(text, number) {
  const cleaned = stripAyahEnd(text)
  if (!cleaned) return ayahEndMark(number)
  return `${cleaned} ${ayahEndMark(number)}`
}
