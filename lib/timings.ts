import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore'
import type { Case, Outcome } from './case'
import { getDb } from './firebase'

// The shared, anonymous pool of how long stuck payments took and where the money ended up.
// Each record holds only: banks, payment type, what the bank app showed, minutes taken and
// the outcome. No names, amounts, account numbers or user ids.
// Firestore rules (see the setup steps) only allow adding records in exactly this shape.

export type Timing = {
  from: string
  to: string
  type: string
  appSays: string // 'successful' | 'pending' | 'failed' | 'unknown'
  outcome: Outcome
  minutes: number
}

const col = () => collection(getDb(), 'timings')
const MAX_MINUTES = 60 * 24 * 30 // anything over 30 days is a mistake, not a timing

export function recordTiming(c: Case, outcome: Outcome, at: number) {
  if (c.notDebited) return
  const minutes = Math.round((at - c.sentAt) / 60000)
  if (minutes < 0 || minutes > MAX_MINUTES) return
  const t: Timing = {
    from: c.from,
    to: c.to,
    type: c.type,
    appSays: c.bankAppSays && c.bankAppSays !== 'unsure' ? c.bankAppSays : 'unknown',
    outcome,
    minutes,
  }
  // Fire and forget: a failed write must never block closing the case
  addDoc(col(), { ...t, at: serverTimestamp() }).catch(() => {})
}

export const MIN_SAMPLE = 20 // below this, the screen shows the CBN rule times instead

export type Outlook = { n: number; outcome: Outcome; within: number }

// "Of n similar cases still stuck after elapsedMin, most were received (or refunded) within X min."
// Only cases that were still stuck at this point count, because those are the ones like yours.
export async function outlook(c: Case, elapsedMin: number): Promise<Outlook | null> {
  const appSays = c.bankAppSays && c.bankAppSays !== 'unsure' ? c.bankAppSays : 'unknown'
  const snap = await getDocs(
    query(col(), where('from', '==', c.from), where('to', '==', c.to), where('appSays', '==', appSays), limit(500))
  )
  const like = snap.docs.map((d) => d.data() as Timing).filter((t) => t.type === c.type && t.minutes > elapsedMin)
  if (like.length < MIN_SAMPLE) return null

  for (const outcome of ['received', 'refunded'] as const) {
    const times = like.filter((t) => t.outcome === outcome).map((t) => t.minutes).sort((a, b) => a - b)
    // "most" = more than half of all similar cases ended this way by this time
    const need = Math.floor(like.length / 2) + 1
    if (times.length >= need) return { n: like.length, outcome, within: times[need - 1] }
  }
  return null
}