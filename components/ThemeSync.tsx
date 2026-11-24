'use client'
import { useEffect } from 'react'
import { applyTheme, readSettings } from '@/lib/settings'

// With "Match phone", switch when the phone changes between light and dark
export function ThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyTheme(readSettings().theme)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return null
}