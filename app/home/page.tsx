'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { when } from '@/components/CaseScreens'
import { Guard, initials } from '@/components/Guard'
import { Path, pathNames, whereNow } from '@/components/MoneyPath'
import { VerifyBanner } from '@/components/VerifyBanner'
import { isRefunded, watchCases, type Case } from '@/lib/case'
import { dur, naira, roughly } from '@/lib/format'
import { reachBy, reversalDue } from '@/lib/payments'
import { buildNotifs, useReadIds } from '@/lib/notifications'
import { useSettings } from '@/lib/settings'
import { useNow } from '@/lib/useNow'
import {Brand } from '@/components/Brand'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const Mark = () => (
  <svg viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="6" cy="29" r="2.4" fill="#FFFFFF" />
    <path d="M6 29C12 29 12 15 19 15S24 25 29 22 33 13 34.5 10" stroke="#FFFFFF" strokeWidth="3.4" />
    <circle cx="34.5" cy="9.5" r="3.8" fill="#E8B923" />
  </svg>
)
const Plus = () => <svg viewBox="0 0 24 24" className="ic" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
const Tick = () => <svg viewBox="0 0 24 24" className="ic" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
const Bell = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)
const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

// "Hide amounts" in Profile: amounts show as ₦••••• until you tap the eye
const money = (n: number, hide: boolean) => (hide ? '₦•••••' : naira(n))

// Most urgent first: failed cases by deadline (overdue on top), then pending ones, oldest first
const urgency = (c: Case) => (c.status === 'awaiting_reversal' ? reversalDue(c) : 4e15 + c.sentAt)

// The short status line and its colour, as on the History cards
function badge(c: Case, now: number): [string, 'red' | 'amber'] {
  if (c.status === 'awaiting_reversal') {
    const left = reversalDue(c) - now
    return left < 0 ? [`Overdue by ${roughly(-left)}`, 'red'] : [`Refund due in ${roughly(left)}`, 'amber']
  }
  return [`Pending · ${dur(now - c.sentAt)}`, 'amber']
}

// The one time that matters for this case right now
function keyTime(c: Case, now: number): { label: string; at: number; late: boolean } {
  const due = reversalDue(c)
  if (c.status === 'awaiting_reversal') return { label: now > due ? 'Refund was due by' : 'Refund due by', at: due, late: now > due }
  const reach = reachBy(c)
  if (reach) return { label: now > reach ? `${c.to} should have credited it by` : `Should reach ${c.to} by`, at: reach, late: now > reach }
  return { label: 'If it fails, back by', at: due, late: now > due }
}

function LatestCard({ c, now, hide }: { c: Case; now: number; hide: boolean }) {
  const where = whereNow(c)
  const [text, tone] = badge(c, now)
  const k = keyTime(c, now)
  return (
    <Link className="hm-card" href={`/case/${c.id}`}>
      <div className="hm-row">
        <span className="tk-tag">YOUR LATEST CASE</span>
        <span className={`tk-badge ${tone === 'red' ? 'red' : 'amber'}`}>{text}</span>
      </div>
      <div className="hm-row base">
        <b className="hm-route">{c.from} → {c.to}</b>
        <b className="hm-amt">{money(c.amount, hide)}</b>
      </div>
      <Path size="lg" now={where.now} names={pathNames(c)} label={where.label} />
      <div className="tk-est-row hm-time">
        <span>{k.label}</span>
        <span>
          <b>{when(k.at)}</b>
          {k.late && <small className="red">Overdue by {roughly(now - k.at)}</small>}
        </span>
      </div>
      <span className="hm-go">Track it →</span>
    </Link>
  )
}

function Row({ c, now, note, hide }: { c: Case; now: number; note?: string; hide: boolean }) {
  const [text, tone] = c.status === 'resolved' ? [note ?? '', 'green'] : badge(c, now)
  return (
    <Link className="hm-item" href={`/case/${c.id}`}>
      <span>
        <b>{c.from} → {c.to}</b>
        <small className={tone}>{text}</small>
      </span>
      <span>
        <b>{money(c.amount, hide)}</b>
        <i aria-hidden>›</i>
      </span>
    </Link>
  )
}

export default function Home() {
  const { user } = useAuth()
  const now = useNow()
  const [cases, setCases] = useState<Case[] | null>(null)
  useEffect(() => (user ? watchCases(user.uid, setCases) : undefined), [user])
  const [settings] = useSettings()
  const read = useReadIds()
  const [show, setShow] = useState(false)
  const hide = settings.hideAmounts && !show

  const all = cases ?? []
  const unread = buildNotifs(all, now, settings).some((n) => !read.has(n.id))
  const open = all.filter((c) => c.status !== 'resolved')
  // The case you reported most recently leads; the rest follow by urgency
  const latest = [...open].sort((a, b) => b.sentAt - a.sentAt)[0]
  const others = open.filter((c) => c !== latest).sort((a, b) => urgency(a) - urgency(b))
  const lastClosed = all
    .filter((c) => c.status === 'resolved')
    .sort((a, b) => (b.resolvedAt ?? b.sentAt) - (a.resolvedAt ?? a.sentAt))[0]
  const first = user?.displayName?.split(' ')[0]
  const closedNote = (c: Case) =>
    c.notDebited
      ? 'Not debited'
      : `${isRefunded(c) ? 'Refunded' : 'Arrived'} ✓${c.resolvedAt ? ` · took ${roughly(c.resolvedAt - c.sentAt)}` : ''}`

  return (
    <Guard>
      <div className="tk">
        <header className="hm-top">
          <div className="hm-bar">
            <Brand />
            <span className="hm-actions">
              <Link className="hm-bell" href="/notifications" aria-label={unread ? 'Notifications, new' : 'Notifications'}>
                <Bell />
                {unread && <i />}
              </Link>
              <Link className="hm-av" href="/profile" aria-label="Profile">{initials(user?.displayName)}</Link>
            </span>
          </div>
          <h1>{greeting()}{first ? `, ${first}` : ''}</h1>
          <p>
            {settings.hideAmounts && (
              <button className="hm-eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide amounts' : 'Show amounts'}>
                <Eye off={!show} />
              </button>
            )}
            {!cases
              ? ' '
              : open.length
                ? `${open.length} case${open.length === 1 ? '' : 's'} still open`
                : 'All clear'}
          </p>
        </header>

        {cases && latest && <LatestCard c={latest} now={now} hide={hide} />}
        {cases && !latest && (
          <div className="hm-card hm-clear">
            <span className="hm-ok"><Tick /></span>
            <b>Nothing stuck right now</b>
            <p>If a transfer fails or hangs, report it and we&apos;ll show you where your money is.</p>
          </div>
        )}
        {!cases && <div className="hm-card hm-wait" aria-hidden />}

        <div className="hm-verify"><VerifyBanner /></div>

        <Link className="tk-btn hm-report" href="/report"><Plus /> Report a failed transaction</Link>

        {others.length > 0 && (
          <section className="hm-list">
            <div className="hm-head">
              <p>OTHER OPEN CASES</p>
              <Link href="/history">See all ›</Link>
            </div>
            {others.slice(0, 4).map((c) => <Row key={c.id} c={c} now={now} hide={hide} />)}
          </section>
        )}

        {cases && !latest && lastClosed && (
          <section className="hm-list">
            <div className="hm-head">
              <p>LAST CASE</p>
              <Link href="/history">History ›</Link>
            </div>
            <Row c={lastClosed} now={now} note={closedNote(lastClosed)} hide={hide} />
          </section>
        )}
      </div>
    </Guard>
  )
}