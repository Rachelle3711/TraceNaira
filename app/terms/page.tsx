import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { TERMS } from '@/lib/legal'

export const metadata: Metadata = { title: 'Terms of use · TraceNaira' }

export default function Terms() {
  return <LegalPage doc={TERMS} other={{ href: '/privacy', title: 'Privacy policy' }} />
}