'use client'
import { useEffect, useState } from 'react'
import { SETTINGS_KEY } from './themeScripts'

// Settings from Profile. Kept on this phone (localStorage), so each phone can have its own look.

export { SETTINGS_KEY }
export type Theme = 'light' | 'dark' | 'system'
export type Settings = {
  theme: Theme
  notify: boolean // main switch for notifications
  notifyLate: boolean // a transfer is late
  notifyDeadline: boolean // a refund deadline is close or missed
  notifyClosed: boolean // a case closes
  defaultBank: string // filled in as the sending bank when reporting
  hideAmounts: boolean // show ₦••••• on Home until tapped
}

export const DEFAULTS: Settings = {
  theme: 'light',
  notify: true,
  notifyLate: true,
  notifyDeadline: true,
  notifyClosed: false,
  defaultBank: '',
  hideAmounts: false,
}

const EVENT = 'tn-settings-change'

export function readSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(patch: Partial<Settings>) {
  const next = { ...readSettings(), ...patch }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    // private mode or storage full: the change still applies until the page reloads
  }
  window.dispatchEvent(new Event(EVENT))
  if (patch.theme) applyTheme(next.theme)
}

// Puts data-theme="light" or "dark" on <html>; the colours in globals.css follow it
export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

// Live settings: updates when changed here or in another tab
export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(DEFAULTS)
  useEffect(() => {
    const load = () => setS(readSettings())
    load()
    window.addEventListener(EVENT, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(EVENT, load)
      window.removeEventListener('storage', load)
    }
  }, [])
  return [s, saveSettings]
}