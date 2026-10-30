import { site } from '../data/site'

export function Footer() {
  return (
    <footer className="pb-2 pt-4 text-center text-xs text-[var(--muted)]">
      © {new Date().getFullYear()} {site.name}
    </footer>
  )
}
