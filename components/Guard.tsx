'use client'
import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { NavBar } from './NavBar'
import { withNext } from '@/lib/next'
import { Splash } from './Splash'

// Wrap every app page and adds the tab bar.
// guest = page also works without an account (cases are kept in this browser).
// Without guest, signed-out visitors are sent to /login, and come back here after logging in.
// nav = show the bottom bar (off for full-screen flows like Report). Guests never get it:
// without an account they only see their one case, not the rest of the app.
export function Guard({ children, guest = false, nav = true }: { children: ReactNode; guest?: boolean; nav?: boolean }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const path = usePathname()
  useEffect(() => {
    if (!loading && !user && !guest) router.replace(withNext('/login', path))
  }, [user, loading, guest, router, path])

  if (loading || (!user && !guest)) return <Splash still />
  return <>{children}{nav && user && <NavBar />}</>
}

export const initials = (name?: string | null) =>
  (name || '?').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()