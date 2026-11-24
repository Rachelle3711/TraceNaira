'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Guard } from '@/components/Guard'
import { TopBar } from '@/components/ui'
import { statusText, watchCase, type Case } from '@/lib/case'
import { fmt, naira } from '@/lib/format'
import { journey } from '@/lib/journey'
import { bankMessage, proofText } from '@/lib/messages'
import { TYPE_LABEL } from '@/lib/payments'
import { shareText } from '@/lib/share'
import { useNow } from '@/lib/useNow'

const BANK_APP_TEXT = { successful: 'Successful', pending: 'Pending', failed: 'Failed', unsure: 'Not sure' } as const

// The dispute / evidence slip: built to be shown to a bank teller or attached to a complaint
export default function EvidenceSlip() {
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
        <TopBar label="SHOW AT YOUR BANK" title="Dispute slip" href={back} />
        <main className="main"><p className="sub">{c === null ? 'Case not found.' : 'Loading…'}</p></main>
      </Guard>
    )
  }

  // Same steps as the case screen, so the slip and the tracker never disagree
  const { steps, due } = journey(c, now)
  const rows: [string, string | undefined][] = [
    ['AMOUNT', naira(c.amount)],
    ['PAYMENT', TYPE_LABEL[c.type] ?? c.type],
    ['FROM', c.from],
    ['TO', c.to],
    ['RECEIVER NAME', c.receiverName],
    ['ATM LOCATION', c.location],
    ['TERMINAL ID', c.terminalId],
    ['CARD', c.cardLast4 ? `•••• ${c.cardLast4}` : undefined],
    ['SENT', fmt(c.sentAt) + (c.sentAtSource === 'session_id' ? ' (from Session ID)' : '')],
    ['SESSION ID', c.sessionId || undefined],
    ['REFERENCE', c.ref || undefined],
    ['BANK APP SHOWED', c.bankAppSays ? BANK_APP_TEXT[c.bankAppSays] : undefined],
    ['STATUS', statusText(c)],
    ['REVERSAL DUE', c.status === 'awaiting_reversal' ? fmt(due) : undefined],
  ]

  async function share() {
    const r = await shareText(`${proofText(c!)}\n\n${bankMessage(c!)}`)
    setMsg(r === 'copied' ? 'COPIED ✓' : '')
  }

  return (
    <Guard guest>
      <TopBar label="SHOW AT YOUR BANK" title="Dispute slip" href={back} />
      <main className="main slip-page">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div className="kv" key={k}><span>{k}</span><b style={{ wordBreak: 'break-all', textAlign: 'right' }}>{v}</b></div>
        ))}
        <p className="lb" style={{ margin: '16px 0 8px' }}>TIMELINE</p>
        {steps.map((x) => (
          <div key={x.title} className={`tl ${x.state}`}>
            <b>{x.title}</b>{x.tag && <span className="tag">{x.tag}</span>}
            {x.at && <small>{x.at}</small>}
          </div>
        ))}
        <p className="tiny">Each line is marked as reported by the customer or estimated. TraceNaira is not a bank and has no access to bank systems.</p>
        <div className="push noprint">
          <button className="btn" onClick={() => window.print()}>PRINT OR SAVE AS PDF</button>
          <button className="btn ol" style={{ marginTop: 8 }} onClick={share}>{msg || 'SHARE SLIP'}</button>
        </div>
      </main>
    </Guard>
  )
}
