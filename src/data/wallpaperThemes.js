/** Color themes for wallpaper generator + live preview particles */
export const wallpaperThemes = [
  {
    id: 'night',
    label: { ru: 'Ночь', en: 'Night', ar: 'ليل' },
    stops: ['#1a1510', '#0c0a08', '#050504'],
    accent: 'rgba(232,200,140,0.4)',
    text: '#f4f4f5',
    muted: 'rgba(244,244,245,0.78)',
    particles: 'stars',
    particleColor: 'rgba(255,255,255,0.85)',
  },
  {
    id: 'emerald',
    label: { ru: 'Изумруд', en: 'Emerald', ar: 'زمردي' },
    stops: ['#0f1c18', '#0a1411', '#050a08'],
    accent: 'rgba(100,210,160,0.38)',
    text: '#eef8f2',
    muted: 'rgba(210,240,220,0.78)',
    particles: 'leaves',
    particleColor: 'rgba(140,230,180,0.75)',
  },
  {
    id: 'ocean',
    label: { ru: 'Океан', en: 'Ocean', ar: 'محيط' },
    stops: ['#0c1820', '#081018', '#04080c'],
    accent: 'rgba(120,190,230,0.36)',
    text: '#eef6fb',
    muted: 'rgba(200,230,245,0.78)',
    particles: 'bubbles',
    particleColor: 'rgba(160,220,255,0.7)',
  },
  {
    id: 'rose',
    label: { ru: 'Закат', en: 'Sunset', ar: 'غروب' },
    stops: ['#221016', '#140a0e', '#080406'],
    accent: 'rgba(255,150,140,0.34)',
    text: '#fff1f0',
    muted: 'rgba(255,210,205,0.78)',
    particles: 'embers',
    particleColor: 'rgba(255,180,140,0.8)',
  },
  {
    id: 'violet',
    label: { ru: 'Сумерки', en: 'Dusk', ar: 'شفق' },
    stops: ['#16121f', '#0d0a14', '#06050a'],
    accent: 'rgba(180,150,255,0.34)',
    text: '#f3eefc',
    muted: 'rgba(220,210,255,0.78)',
    particles: 'sparkles',
    particleColor: 'rgba(210,190,255,0.85)',
  },
  {
    id: 'gold',
    label: { ru: 'Золото', en: 'Gold', ar: 'ذهبي' },
    stops: ['#1c170c', '#120e08', '#080603'],
    accent: 'rgba(240,200,110,0.4)',
    text: '#fff8e8',
    muted: 'rgba(245,225,170,0.8)',
    particles: 'dust',
    particleColor: 'rgba(240,210,140,0.8)',
  },
]

export function getWallpaperTheme(id) {
  return wallpaperThemes.find((t) => t.id === id) || wallpaperThemes[0]
}
