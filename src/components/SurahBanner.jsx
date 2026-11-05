/** Decorative Madani-style surah title banner */
export function SurahBanner({ arabic, subtitle, dark = false }) {
  const ink = dark ? '#f4f4f5' : '#1a1712'
  const muted = dark ? 'rgba(244,244,245,0.65)' : '#6b5f4c'
  const fill = dark
    ? 'linear-gradient(180deg, rgba(40,55,40,0.55), rgba(28,36,28,0.35))'
    : 'linear-gradient(180deg, #f7f1e2 0%, #efe4cc 100%)'
  const border = dark ? 'rgba(212,175,55,0.55)' : '#c9a84c'

  return (
    <div className="surah-banner mx-auto w-full max-w-sm" role="heading" aria-level={3}>
      <div
        className="relative overflow-hidden rounded-xl px-4 py-3 text-center"
        style={{
          background: fill,
          border: `1.5px solid ${border}`,
          boxShadow: `inset 0 0 0 1px ${dark ? 'rgba(212,175,55,0.2)' : 'rgba(201,168,76,0.35)'}, 0 6px 20px rgba(0,0,0,0.08)`,
        }}
      >
        <span className="surah-banner-ornament surah-banner-ornament--left" aria-hidden />
        <span className="surah-banner-ornament surah-banner-ornament--right" aria-hidden />
        <p className="font-quran relative z-10 text-[1.45rem] leading-snug" style={{ color: ink }} dir="rtl">
          {arabic}
        </p>
        {subtitle ? (
          <p className="relative z-10 mt-1 text-[10px] tracking-wide" style={{ color: muted }}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}
