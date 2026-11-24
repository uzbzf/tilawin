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
 * In KFGQPC UthmanicHafs (Quran2013.woff2), codepoints U+FC00..U+FD1D (0xFC00 + ayahNumber - 1, for 1..286)
 * are mapped directly in the font's cmap table to pre-composed composite glyphs (gid 1126..1411)
 * that render ONE single Madani ayah-end ornamental frame with the ayah number centered inside.
 * (Using U+06DD + digits instead causes a duplicate empty ornament frame because U+06DD is a standalone
 * empty frame and single-digit GSUB Lookup 36 rules have compCount=1 which HarfBuzz skips.)
 */
export function ayahEndMark(number) {
  if (number == null || number === '') return ''
  const n = Number(number)
  if (Number.isInteger(n) && n >= 1 && n <= 286) {
    return String.fromCharCode(0xfc00 + n - 1)
  }
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
  if (!cleaned) return `(${toArabicIndic(number)})`
  return `${cleaned} (${toArabicIndic(number)})`
}
