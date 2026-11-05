import { stripAyahEnd, toArabicIndic } from '../lib/ayahMark'

/**
 * Vector ayah-end mark (no Unicode ۝ / ornate glyphs).
 * Thin liquid-glass ring + digit centered in SVG.
 */
export function AyahEnd({ n, className = '' }) {
  const digits = toArabicIndic(n)
  if (!digits) return null
  const gradId = `ayah-glass-${String(n).replace(/[^\w-]/g, '')}`

  return (
    <svg
      className={`ayah-end-mark ${className}`.trim()}
      viewBox="0 0 32 32"
      width="1em"
      height="1em"
      aria-label={String(n)}
      role="img"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--ayah-mark-fill-a)" />
          <stop offset="100%" stopColor="var(--ayah-mark-fill-b)" />
        </linearGradient>
      </defs>
      <circle
        className="ayah-end-mark__ring"
        cx="16"
        cy="16"
        r="13.25"
        fill={`url(#${gradId})`}
        strokeWidth="1.35"
      />
      <circle
        className="ayah-end-mark__inner"
        cx="16"
        cy="16"
        r="11.4"
        fill="none"
        strokeWidth="0.7"
      />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        className="ayah-end-mark__digit"
      >
        {digits}
      </text>
    </svg>
  )
}

/** Arabic text + SVG ayah-end mark (API Unicode markers stripped first). */
export function ArabicWithAyahEnd({ text, number, className = '' }) {
  const cleaned = stripAyahEnd(text)
  return (
    <span className={`arabic-with-ayah-end ${className}`.trim()} dir="rtl">
      {cleaned}
      {cleaned ? ' ' : null}
      <AyahEnd n={number} />
    </span>
  )
}
