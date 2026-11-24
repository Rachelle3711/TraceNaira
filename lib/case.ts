import {
  addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp,
  Timestamp, updateDoc, writeBatch, type DocumentData,
} from 'firebase/firestore'
import { getDb } from './firebase'
import { addGuest, patchGuest, readClaimMap, readGuest, removeGuest, saveClaimMap, watchGuest } from './guest'
import { recordTiming } from './timings'

// Stored values stay the same so existing cases keep working.
// What users see: processing = Pending, awaiting_reversal = Failed · refund due, resolved = Arrived or Refunded.
export type Status = 'processing' | 'awaiting_reversal' | 'resolved'
// What the sender's bank app showed for the payment ('unsure' only on older cases)
export type BankAppSays = 'successful' | 'pending' | 'failed' | 'unsure'
// Where the money ended up: it reached the receiver, or it came back to the sender
export type Outcome = 'received' | 'refunded'

export type Case = {
  id: string
  amount: number
  from: string
  to: string // bank, merchant, biller or ATM's bank, depending on type
  type: string
  ref: string
  status: Status
  sentAt: number
  failedAt?: number
  resolvedAt?: number
  sessionId?: string
  sentAtSource?: 'session_id' | 'user' // where the sent time came from
  bankAppSays?: BankAppSays // older cases won't have this
  notDebited?: boolean // closed because no money left the account
  receiverName?: string
  terminalId?: string
  cardLast4?: string
  location?: string // ATM location
  askAgainAt?: number // "still unsure, remind me" (older cases)
  outcome?: Outcome // set when the case closes; older cases use failedAt instead
}

// Owner = the signed-in user's uid, or null for a guest (cases kept in this browser)
export type Owner = string | null

const col = (uid: string) => collection(getDb(), 'users', uid, 'cases')
const docRef = (uid: string, id: string) => doc(getDb(), 'users', uid, 'cases', id)
const TIME_FIELDS = ['sentAt', 'failedAt', 'resolvedAt', 'askAgainAt'] as const

function toCase(id: string, x: DocumentData): Case {
  const c = { ...x, id } as Record<string, unknown>
  for (const k of TIME_FIELDS) c[k] = x[k]?.toMillis ? x[k].toMillis() : undefined
  return c as Case
}

// Firestore wants Timestamps instead of millisecond numbers, and no undefined values
function toStore(patch: Partial<Case>) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || k === 'id') continue
    out[k] = (TIME_FIELDS as readonly string[]).includes(k) ? Timestamp.fromMillis(v as number) : v
  }
  return out
}

export type NewCase = Omit<Case, 'id' | 'status' | 'failedAt' | 'resolvedAt'>

// If the bank app already says Failed, the case starts as waiting for a refund.
export async function addCase(owner: Owner, c: NewCase): Promise<{ id: string }> {
  const failed = c.bankAppSays === 'failed'
  const data: Omit<Case, 'id'> = {
    ...c,
    status: failed ? 'awaiting_reversal' : 'processing',
    ...(failed ? { failedAt: Date.now() } : {}),
  }
  if (!owner) return addGuest(data)
  return addDoc(col(owner), { ...toStore(data), createdAt: serverTimestamp() })
}

export function patchCase(owner: Owner, id: string, patch: Partial<Case>) {
  if (!owner) return Promise.resolve(patchGuest(id, patch))
  return updateDoc(docRef(owner, id), toStore(patch))
}

export const setBankAppSays = (o: Owner, id: string, v: BankAppSays) => patchCase(o, id, { bankAppSays: v })
export const markFailed = (o: Owner, id: string) =>
  patchCase(o, id, { status: 'awaiting_reversal', failedAt: Date.now(), bankAppSays: 'failed' })

// Closes the case where the money ended up, at the time the person says it happened,
// and adds the timing (no personal details) to the shared pool used for estimates.
export async function markOutcome(o: Owner, c: Case, outcome: Outcome, at: number) {
  await patchCase(o, c.id, { status: 'resolved', resolvedAt: at, outcome })
  recordTiming(c, outcome, at)
}

// True when the money came back to the sender
export const isRefunded = (c: Case) => (c.outcome ? c.outcome === 'refunded' : !!c.failedAt)

// Each watch function calls cb on every change and returns an unsubscribe function.
export function watchCases(owner: Owner, cb: (c: Case[]) => void) {
  if (!owner) return watchGuest(cb)
  return onSnapshot(query(col(owner), orderBy('sentAt', 'desc')), (s) => cb(s.docs.map((d) => toCase(d.id, d.data()))))
}

export function watchCase(owner: Owner, id: string, cb: (c: Case | null) => void) {
  if (!owner) return watchGuest((list) => cb(list.find((c) => c.id === id) ?? null))
  return onSnapshot(docRef(owner, id), (s) => cb(s.exists() ? toCase(s.id, s.data()) : null))
}

// Moves cases reported as a guest into the account. Safe to call many times.
// Returns old id → new id, so a guest case link can be redirected after login.
let claiming: Promise<Record<string, string>> | null = null
export function claimGuestCases(uid: string) {
  if (claiming) return claiming
  claiming = (async () => {
    const map = readClaimMap()
    for (const g of readGuest()) {
      const saved = await addDoc(col(uid), { ...toStore(g), createdAt: serverTimestamp() })
      map[g.id] = saved.id
      saveClaimMap(map)
      removeGuest(g.id)
    }
    return map
  })().finally(() => {
    claiming = null
  })
  return claiming
}
// Deletes cases: only the closed ones, or all of them. Works for guests too.
// (A Firestore batch can hold up to 500 deletes.)
export type ClearWhich = 'closed' | 'all'
export async function clearCases(owner: Owner, which: ClearWhich = 'all') {
  const keep = (c: Case) => which === 'closed' && c.status !== 'resolved'
  if (!owner) {
    readGuest().filter((c) => !keep(c)).forEach((c) => removeGuest(c.id))
    return
  }
  const snap = await getDocs(col(owner))
  const batch = writeBatch(getDb())
  snap.docs.forEach((d) => {
    if (!keep(toCase(d.id, d.data()))) batch.delete(d.ref)
  })
  await batch.commit()
}
// Downloads the cases as a spreadsheet file (opens in Excel or Google Sheets)
export function downloadCsv(cases: Case[]) {
  const url = URL.createObjectURL(new Blob([toCsv(cases)], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'tracenaira-cases.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// One set of status names, used everywhere
export function statusText(c: Case) {
  if (c.status === 'resolved') return c.notDebited ? 'Closed · not debited' : isRefunded(c) ? 'Refunded ✓' : 'Arrived ✓'
  if (c.status === 'awaiting_reversal') return 'Failed · refund due'
  return 'Pending'
}
export const statusColor = (c: Case) =>
  c.status === 'resolved' ? 'green' : c.status === 'awaiting_reversal' ? 'red' : 'amber'

// Short label for a case: its own reference, else the end of the Session ID
export const caseRef = (c: Case) => c.ref || (c.sessionId ? `SID …${c.sessionId.slice(-8)}` : '')

// Turns the cases into text a spreadsheet can open.
export function toCsv(cases: Case[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const head = ['Date sent', 'Amount', 'From', 'To', 'Type', 'Session ID', 'Reference', 'Bank app said', 'Status', 'Resolved']
  const rows = cases.map((c) => [
    new Date(c.sentAt).toISOString(), c.amount, c.from, c.to, c.type, c.sessionId ?? '', c.ref, c.bankAppSays ?? '',
    statusText(c), c.resolvedAt ? new Date(c.resolvedAt).toISOString() : '',
  ])
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}