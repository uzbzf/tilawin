import { ContactCard } from '../components/ContactCard'
import { Hero } from '../components/Hero'
import { LiveCounters } from '../components/LiveCounters'
import { SocialLinks } from '../components/SocialLinks'

export function HomeScreen() {
  return (
    <div className="flex flex-col gap-6">
      <Hero />
      <LiveCounters focus={['telegram', 'tiktok']} />
      <SocialLinks />
      <ContactCard />
    </div>
  )
}
