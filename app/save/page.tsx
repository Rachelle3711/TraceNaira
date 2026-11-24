import { redirect } from 'next/navigation'
import { withNext } from '@/lib/next'

// so this just sends any old link to Sign up and back to the case afterwards.
export default async function Save({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const { case: id } = await searchParams
  redirect(withNext('/signup', id ? `/case/${id}` : '/home'))
}