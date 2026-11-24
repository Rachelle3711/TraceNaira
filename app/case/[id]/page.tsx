'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Brand } from '@/components/Brand'
import { Guard } from '@/components/Guard'
import { statusText, watchCase, type Case } from '@/lib/case'
import { naira } from '@/lib/format'
import { journey } from '@/lib/journey'
import { bankMessage, proofText } from '@/lib/messages'
import { TYPE_LABEL } from '@/lib/payments'
import { shareText } from '@/lib/share'
import { useNow } from '@/lib/useNow'

// The dispute slip: looks like a bank receipt, to show a teller or attach to a complaint.
// Only the white card prints (see the print rules in globals.css).

const BANK_APP_TEXT = { successful: 'Successful', pending: 'Pending', failed: 'Failed', unsure: 'Not sure' } as const

// "23 Nov 2026, 14:05": the year matters on a document someone may keep
const full = (ms: number) =>
  new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// A short case number from the case id, e.g. TN-7Q4K2
const caseNo = (id: string) => `TN-${id.replace(/[^a-z0-9]/gi, '').slice(-5).toUpperCase()}`

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>{children}</svg>
)
const Back = () => <Svg><path d="m15 18-6-6 6-6" /></Svg>
const Print = () => (
  <Svg>
    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 14h12v7H6z" />
  </Svg>
)
const Share = () => <Svg><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></Svg>

function Top({ back }: { back: string }) {
  return (
    <header className="hs-top sl-top noprint">
      <Link className="tk-round" href={back} aria-label="Back to the case"><Back /></Link>
      <h1>Dispute slip</h1>
      <p>Show it at your bank or attach it to a complaint</p>
    </header>
  )
}

export default function DisputeSlip() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const now = useNow()
  const [c, setC] = useState<Case | null | undefined>(undefined)
  const [msg, setMsg] = useState('')
  useEffect(() => (loading ? undefined : watchCase(user?.uid ?? null, id, setC)), [loading, user, id])

  const back = `/case/${id}`
  if (!c) {
    return (
      <Guard guest>
        <div className="tk">
          <Top back={back} />
          <p className="tk-note">{c === null ? 'Case not found.' : 'Loading…'}</p>
        </div>
      </Guard>
    )
  }

  // Same steps as the case screen, so the slip and the tracker never disagree
  const { steps, due } = journey(c, now)
  const rows: [string, string | undefined, boolean?][] = [
    ['Payment', TYPE_LABEL[c.type] ?? c.type],
    ['From', c.from],
    ['To', c.to],
    ['Receiver name', c.receiverName],
    ['ATM location', c.location],
    ['Terminal ID', c.terminalId, true],
    ['Card', c.cardLast4 ? `•••• ${c.cardLast4}` : undefined],
    ['Sent', full(c.sentAt) + (c.sentAtSource === 'session_id' ? ' (from Session ID)' : '')],
    ['Session ID', c.sessionId || undefined, true],
    ['Reference', c.ref || undefined, true],
    ['Bank app showed', c.bankAppSays ? BANK_APP_TEXT[c.bankAppSays] : undefined],
    ['Status', statusText(c)],
    ['Refund due', c.status === 'awaiting_reversal' ? full(due) : undefined],
  ]

  async function share() {
    const r = await shareText(`${proofText(c!)}\n\n${bankMessage(c!)}`)
    setMsg(r === 'copied' ? 'Copied ✓' : '')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <Guard guest>
      <div className="tk sl">
        <Top back={back} />

        <article className="sl-card">
          <div className="sl-head">
            <Brand />
            <span className="sl-no">CASE {caseNo(c.id)}</span>
          </div>
          <p className="sl-lb">Amount</p>
          <p className="sl-amt">{naira(c.amount)}</p>

          {rows
            .filter(([, v]) => v)
            .map(([k, v, mono]) => (
              <div className="sl-row" key={k}>
                <span>{k}</span>
                <b className={mono ? 'sl-mono' : undefined}>{v}</b>
              </div>
            ))}

          <p className="sl-tag">TIMELINE</p>
          <ol className="sl-tl">
            {steps.map((x) => (
              <li key={x.title} className={x.state}>
                <b>{x.title}</b>
                {x.tag && <em>{x.tag}</em>}
                <small>
                  {x.sub}
                  {x.at ? ` · ${x.at}` : ''}
                </small>
              </li>
            ))}
          </ol>

          <p className="sl-foot">
            Each line says whether the customer reported it or it is an estimate. TraceNaira is not a bank and has no access
            to bank systems. Made {full(now)}.
          </p>
        </article>

        <div className="sl-btns noprint">
          <button className="tk-btn" onClick={() => window.print()}><Print /> Print or save as PDF</button>
          <button className="tk-btn ol" onClick={share}><Share /> {msg || 'Share slip'}</button>
        </div>
      </div>
    </Guard>
  )
}