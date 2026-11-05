const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** Convert Western digits to Arabic-Indic */
export function toArabicIndic(value) {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] || digit)
}

/**
 * Madani ayah-end ligature: ARABIC END OF AYAH (U+06DD) + Arabic-Indic digits.
 * With Quran2013 / Uthmanic Hafs the digits render inside the circular ornament.
 */
export function ayahEndMark(number) {
  return `\u06DD${toArabicIndic(number)}`
}

/** Strip trailing ayah markers / ornate parens / digits, then append proper end mark */
export function withAyahEnd(text, number) {
  const cleaned = String(text || '')
    .replace(/[\u06DD\uFD3E\uFD3F﴾﴿٠-٩0-9\s]+$/gu, '')
    .trim()
  return `${cleaned} ${ayahEndMark(number)}`
}
