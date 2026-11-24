'use client'
import { useEffect, useState } from 'react'
import type { Case } from './case'
import { isRefunded } from './case'
import { caseAlerts } from './alerts'
import { naira, roughly } from './format'
import type { Settings } from './settings'

// Notifications are worked out from your cases, so they need no server.
// Which kinds show follows Profile → Settings → Notifications.

export type Notif = {
  id: string // stays the same for the same event, so "read" sticks
  caseId: string
  tone: 'red' | 'amber' | 'green' | 'info'
  title: string
  body: string
  at: number // when it happened, for sorting and "12 min ago"
}

const DAY = 864e5
const CLOSED_FOR = 14 * DAY // closed cases show for 2 weeks

// Late, due soon and overdue come from lib/alerts.ts, the same text the phone alerts use.
export function buildNotifs(cases: Case[], now: number, s: Settings): Notif[] {
  if (!s.notify) return []
  const out: Notif[] = []
  for (const c of cases) {
    out.push(...caseAlerts(c, now, s))
    if (c.status === 'resolved' && s.notifyClosed && !c.notDebited && c.resolvedAt && now - c.resolvedAt < CLOSED_FOR) {
      const amt = naira(c.amount)
      const back = isRefunded(c)
      out.push({
        id: `${c.id}:closed`,
        caseId: c.id,
        tone: 'green',
        title: 'Case closed',
        body: back
          ? `${amt} came back from ${c.from}. It took ${roughly(c.resolvedAt - c.sentAt)}.`
          : `${amt} arrived at ${c.to}. It took ${roughly(c.resolvedAt - c.sentAt)}.`,
        at: c.resolvedAt,
      })
    }
  }
  return out.sort((a, b) => b.at - a.at)
}

// Which notifications have been opened, kept on this phone
const READ_KEY = 'tn_read_notifs'
const EVENT = 'tn-read-change'

function readIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '[]')
  } catch {
    return []
  }
}

export function markRead(id: string) {
  const ids = readIds()
  if (ids.includes(id)) return
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids, id].slice(-300)))
  } catch {
    // storage blocked: it just won't remember
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useReadIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    const load = () => setIds(new Set(readIds()))
    load()
    window.addEventListener(EVENT, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(EVENT, load)
      window.removeEventListener('storage', load)
    }
  }, [])
  return ids
}