const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** Convert Western digits to Arabic-Indic */
export function toArabicIndic(value) {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)] || digit)
}

/**
 * Normalize Arabic Quranic text for KFGQPC Uthmanic Script HAFS (Quran2013 / UthmanicHafs1Ver18):
 * 1. Convert standard circular sukun (U+0652) -> Madani Mushaf compact kha-head sukun (U+06E1, ۡ).
 * 2. Convert small low seen (U+06E3, unmapped in Quran2013) -> small high seen (U+06DC, ۜ).
 * 3. Strip U+06DF (Sifr Mustadir in Tanzil, which maps to a giant solid circle placeholder in Quran2013)
 *    and any other unmapped placeholder codepoints in U+0600..U+06FF.
 */
export function normalizeQuranText(text) {
  let next = String(text || '')
  // Replace circular sukun U+0652 with compact Madani Mushaf sukun U+06E1 (head of kha)
  next = next.replace(/\u0652/g, '\u06E1')
  // Map Tanzil small low seen U+06E3 to KFGQPC small high seen U+06DC
  next = next.replace(/\u06E3/g, '\u06DC')
  // Remove U+06DF (renders as a huge solid white circle in Quran2013) and other unmapped placeholder glyphs
  next = next.replace(/[\u0600-\u0620\u0658-\u065D\u065F\u06DF\u06E0\u06EB\u06EE-\u06FF]/g, '')
  return next
}

/**
 * Madani ayah-end mark for Quran2013 (UthmanicHafs1Ver18):
 * In KFGQPC UthmanicHafs, Arabic-Indic digits (U+0660..U+0669) automatically form
 * the complete ornamental ayah-end frame with the number inside via GSUB rlig (Lookup 36).
 * Do NOT prepend U+06DD — U+06DD renders a separate empty ornamental frame next to the numbered one.
 */
export function ayahEndMark(number) {
  if (number == null || number === '') return ''
  return toArabicIndic(number)
}

/**
 * Remove every existing end-of-ayah / ornate / trailing digit marker and normalize
 * harakat so we never render empty circles or duplicate ornaments.
 */
export function stripAyahEnd(text) {
  let next = normalizeQuranText(text)
  next = next.replace(/\u06DD[\u0660-\u06690-9]*/g, '')
  next = next.replace(/[\u06DD\u06DE\uFC00-\uFD1D]+/g, '')
  next = next.replace(/[\uFD3F﴾]\s*[\u0660-\u06690-9]*\s*[\uFD3E﴿]?/g, '')
  next = next.replace(/[\uFD3E\uFD3F﴾﴿]/g, '')
  next = next.replace(/(?:\s|\u200B|\u200C|\u200D|\u200E|\u200F|\uFEFF)*[\u0660-\u06690-9]+$/u, '')
  next = next.replace(/\u200B|\u200C|\u200D|\u200E|\u200F|\uFEFF/g, '')
  return next.replace(/\s+/g, ' ').trim()
}

/** Append ayah number for plain-text copy */
export function withAyahEnd(text, number) {
  const cleaned = stripAyahEnd(text)
  if (!cleaned) return ayahEndMark(number)
  return `${cleaned} (${toArabicIndic(number)})`
}
