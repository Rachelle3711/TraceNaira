import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { PRIVACY } from '@/lib/legal'

export const metadata: Metadata = { title: 'Privacy policy · TraceNaira' }

export default function Privacy() {
  return <LegalPage doc={PRIVACY} other={{ href: '/terms', title: 'Terms of use' }} />
}