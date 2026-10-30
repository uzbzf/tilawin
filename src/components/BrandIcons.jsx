export function InstagramIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" />
    </svg>
  )
}

export function TelegramIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20.5 5.2 3.8 11.4c-1.1.4-1.1 1.1-.2 1.4l4.3 1.3 1.6 5c.2.7.1.9.8.9.4 0 .6-.2.8-.4l2.4-2.3 4.5 3.3c.8.5 1.4.2 1.6-.8l2.8-13.2c.3-1.1-.4-1.6-1.2-1.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="m8.2 13.8 9.6-6.2-6.4 7.6-.2 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function TikTokIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M14 4c.4 2.6 1.8 4.2 4.4 4.6v2.4c-1.6 0-3-.5-4.4-1.4v6.6A5.8 5.8 0 1 1 9.6 10.6v2.5a3.4 3.4 0 1 0 2.4 3.2V4h2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const brandIcons = {
  instagram: InstagramIcon,
  telegram: TelegramIcon,
  tiktok: TikTokIcon,
}
