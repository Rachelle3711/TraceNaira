// Cases for people who reported without an account. They live in this browser only
// (localStorage) until the person signs up or logs in, then they move to their account.
import type { Case } from './case'

const KEY = 'tn_guest_cases'
const EVT = 'tn-guest-change'

export const isGuestId = (id: string) => id.startsWith('g_')

export function readGuest(): Case[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as Case[]
    return Array.isArray(list) ? list.sort((a, b) => b.sentAt - a.sentAt) : []
  } catch {
    return [] // private mode or broken data
  }
}

function writeGuest(list: Case[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage full or blocked */
  }
  window.dispatchEvent(new Event(EVT))
}

export function addGuest(data: Omit<Case, 'id'>) {
  const id = 'g_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  writeGuest([...readGuest(), { ...data, id }])
  return { id }
}

export function patchGuest(id: string, patch: Partial<Case>) {
  writeGuest(readGuest().map((c) => (c.id === id ? { ...c, ...patch } : c)))
}

export function removeGuest(id: string) {
  writeGuest(readGuest().filter((c) => c.id !== id))
}

// Calls cb now and on every change (also from other tabs). Returns an unsubscribe function.
export function watchGuest(cb: (list: Case[]) => void) {
  const run = () => cb(readGuest())
  run()
  window.addEventListener(EVT, run)
  window.addEventListener('storage', run)
  return () => {
    window.removeEventListener(EVT, run)
    window.removeEventListener('storage', run)
  }
}

// Remembers which guest case became which account case, so old links still work after login
const MAP_KEY = 'tn_claimed'
export function readClaimMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || '{}')
  } catch {
    return {}
  }
}
export function saveClaimMap(map: Record<string, string>) {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(map))
  } catch {}
}
