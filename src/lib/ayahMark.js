const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** Convert Western digits to Arabic-Indic */
export function toArabicIndic(value) {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] || digit)
}

/**
 * Unicode ayah-end mark: ARABIC END OF AYAH (U+06DD) + Arabic-Indic digits.
 * Renders as one Madani circle with the number in Quran2013.
 */
export function ayahEndMark(number) {
  return `\u06DD${toArabicIndic(number)}`
}

/**
 * Remove every existing end-of-ayah / ornate / trailing digit so we never
 * leave an empty circle next to our mark.
 */
export function stripAyahEnd(text) {
  let next = String(text || '')
  next = next.replace(/\u06DD[\u0660-\u0669٠-٩0-9]*/g, '')
  next = next.replace(/\u06DD+/g, '')
  next = next.replace(/[\uFD3F﴾]\s*[\u0660-\u0669٠-٩0-9]*\s*[\uFD3E﴿]?/g, '')
  next = next.replace(/[\uFD3E\uFD3F﴾﴿]/g, '')
  next = next.replace(/(?:[\s\u200b\u200c\u200d\u200e\u200f\uFEFF]*)[\u0660-\u0669٠-٩0-9]+$/u, '')
  next = next.replace(/[\u200b\u200c\u200d\u200e\u200f\uFEFF]/g, '')
  return next.replace(/\s+/g, ' ').trim()
}

/** Append Unicode ayah-end for plain-text copy */
export function withAyahEnd(text, number) {
  const cleaned = stripAyahEnd(text)
  if (!cleaned) return ayahEndMark(number)
  return `${cleaned} ${ayahEndMark(number)}`
}
