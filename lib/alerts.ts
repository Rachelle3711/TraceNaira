// The alerts about an open case: it's late, its refund is due soon, or its refund is overdue.
// Used in two places, so they always say the same thing:
// the Notifications screen in the app, and the phone alerts sent by netlify/functions/send-alerts.mts.
// Keep this file free of React and Firebase so the server can use it too.
import { isWallet } from './banks'
import { reachBy, reversalDue } from './payments'

export type AlertKind = 'late' | 'due' | 'overdue'

export type Alert = {
  id: string // "{caseId}:late" etc. Stays the same, so it's only sent once and "read" sticks
  kind: AlertKind
  caseId: string
  tone: 'red' | 'amber' | 'info'
  title: string
  body: string
  at: number // when it happened
}

// Which kinds this phone wants (Profile → Notifications)
export type AlertPrefs = { notify: boolean; notifyLate: boolean; notifyDeadline: boolean }

export type AlertCase = { id: string; amount: number; from: string; to: string; type: string; status: string; sentAt: number }

const HOUR = 3600000
export const DUE_SOON = 2 * HOUR // "refund due in 2 hours"

export const wants = (p: AlertPrefs, kind: AlertKind) =>
  p.notify && (kind === 'late' ? p.notifyLate : p.notifyDeadline)

// tz: the server passes 'Africa/Lagos'; the app leaves it out and uses the phone's own time
function words(tz?: string) {
  const time = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz })
  const day = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: tz })
  const key = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: tz })
  // "09:40 today", "08:00 tomorrow", "21 Nov, 08:00"
  const at = (ms: number, now: number) =>
    key(ms) === key(now) ? `${time(ms)} today` : key(ms) === key(now + 24 * HOUR) ? `${time(ms)} tomorrow` : `${day(ms)}, ${time(ms)}`
  return { time, at }
}

const naira = (n: number) => '₦' + n.toLocaleString('en-NG')

// "40 min", "2 hours"
function soon(ms: number) {
  const m = Math.max(1, Math.round(ms / 60000))
  if (m < 60) return `${m} min`
  const h = Math.round(m / 60)
  return `${h} hour${h === 1 ? '' : 's'}`
}

// At most one alert per case at a time. Pass prefs to leave out kinds that are switched off.
export function caseAlerts(c: AlertCase, now: number, prefs?: AlertPrefs, tz?: string): Alert[] {
  const { time, at } = words(tz)
  const amt = naira(c.amount)
  const due = reversalDue(c)
  let a: Alert | null = null

  if (c.status === 'processing') {
    // Transfers should land within 4 minutes. Other payments are late once the refund deadline passes.
    const by = reachBy(c) ?? due
    if (now > by)
      a = {
        id: `${c.id}:late`,
        kind: 'late',
        caseId: c.id,
        tone: 'amber',
        title: `${amt} to ${c.to} is late`,
        body: `It should have arrived by ${reachBy(c) ? time(by) : at(by, now)}. Send a message to ${c.from}.`,
        at: by,
      }
  }

  if (c.status === 'awaiting_reversal') {
    if (now > due)
      a = {
        id: `${c.id}:overdue`,
        kind: 'overdue',
        caseId: c.id,
        tone: 'red',
        title: `${c.from} refund is overdue`,
        body: `${amt} was due back ${at(due, now)}. ${isWallet(c.from) ? `Call ${c.from}'s support line.` : `Visit a ${c.from} branch.`}`,
        at: due,
      }
    else if (due - now <= DUE_SOON)
      a = {
        id: `${c.id}:due`,
        kind: 'due',
        caseId: c.id,
        tone: 'info',
        title: `${c.from} refund due in ${soon(due - now)}`,
        body: `${amt} should be back by ${at(due, now)}.`,
        at: due - DUE_SOON,
      }
  }

  return a && (!prefs || wants(prefs, a.kind)) ? [a] : []
}

// Quiet hours, 10pm to 7am Lagos time (Nigeria is UTC+1 all year)
export function quietNow(now: number) {
  const h = (new Date(now).getUTCHours() + 1) % 24
  return h >= 22 || h < 7
}