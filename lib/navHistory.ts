'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// How many pages this tab has shown inside the app since it loaded.
// 1 means the current page is the first one, so "back" would leave the app.
let pagesSeen = 0
let lastPath = ''
export const cameFromApp = () => pagesSeen > 1

// Counts page changes. Rendered once in the root layout.
export function NavTracker() {
  const path = usePathname()
  useEffect(() => {
    if (path === lastPath) return // React may run this twice in development
    lastPath = path
    pagesSeen += 1
  }, [path])
  return null
}