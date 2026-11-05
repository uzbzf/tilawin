/** Madani Mushaf (604 pages) — Juz start pages */
export const JUZ_START_PAGE = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402,
  422, 442, 462, 482, 502, 522, 542, 562, 582,
]

/** Approximate Madani start page for each surah 1..114 */
export const SURAH_START_PAGE = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322,
  332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477,
  483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551,
  553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 586,
  587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 600,
  600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604,
]

export function juzFromPage(page) {
  let juz = 1
  for (let i = 0; i < JUZ_START_PAGE.length; i += 1) {
    if (page >= JUZ_START_PAGE[i]) juz = i + 1
  }
  return juz
}

export function surahFromPage(page) {
  let surah = 1
  for (let i = 0; i < SURAH_START_PAGE.length; i += 1) {
    if (page >= SURAH_START_PAGE[i]) surah = i + 1
  }
  return surah
}

export function juzRange(juz) {
  const start = JUZ_START_PAGE[juz - 1] || 1
  const end = juz >= 30 ? 604 : (JUZ_START_PAGE[juz] || 605) - 1
  return { start, end }
}

export function mushafPageUrl(page) {
  const n = String(Math.min(604, Math.max(1, Number(page) || 1))).padStart(3, '0')
  return `https://cdn.quran.ws/svg/pages/v1.1.1/hafs-kfqc/${n}.svg`
}

export function mushafPageFallbacks(page) {
  const n = String(Math.min(604, Math.max(1, Number(page) || 1))).padStart(3, '0')
  const raw = Number(n)
  // King Fahd Complex Madani (Hafs) with ayah-end ornaments baked into the page
  return [
    `https://cdn.quran.ws/svg/pages/v1.1.1/hafs-kfqc/${n}.svg`,
    `https://android.quran.com/data/width_1260/page${n}.png`,
    `https://www.mp3quran.net/api/quran_pages_svg/${n}.svg`,
    `https://www.mp3quran.net/api/quran_pages_jpeg/${raw}.jpg`,
  ]
}
