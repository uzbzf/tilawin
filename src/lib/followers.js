/**
 * Живые счётчики.
 * Telegram: публичная страница t.me/tilawin (355 на момент проверки).
 * Instagram и TikTok без API недоступны — не показываем выдуманные числа.
 */
export async function getFollowerCounts() {
  let telegram = 355
  try {
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://t.me/tilawin')}`
    const res = await fetch(url)
    if (res.ok) {
      const html = await res.text()
      const match = html.match(/([\d\s\u00a0]+)\s+subscribers/i)
      const n = match ? Number(String(match[1]).replace(/[^\d]/g, '')) : null
      if (n && n > 0 && n < 1_000_000) telegram = n
    }
  } catch {
    /* keep 355 */
  }

  return {
    instagram: null,
    telegram,
    tiktok: null,
  }
}
