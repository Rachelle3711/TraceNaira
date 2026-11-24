'use client'
import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { NavBar } from './NavBar'
import { Splash } from './Splash'

// Wrap every app page and adds the tab bar.
// guest = page also works without an account (cases are kept in this browser).
// Without guest, signed-out visitors are sent to /login.
export function Guard({ children, guest = false, nav = true }: { children: ReactNode; guest?: boolean; nav?: boolean }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user && !guest) router.replace('/login')
  }, [user, loading, guest, router])

  if (loading || (!user && !guest)) return <Splash />
   // Guests never get the bottom bar: without an account they only see their one case
  return <>{children}{nav && user && <NavBar />}</>
}

export const initials = (name?: string | null) =>
  (name || '?').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
