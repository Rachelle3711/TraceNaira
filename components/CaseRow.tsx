import Link from 'next/link'
import { caseRef, statusColor, statusText, type Case } from '@/lib/case'
import { ago, naira } from '@/lib/format'
import { TYPE_LABEL } from '@/lib/payments'

// One tappable case in a list. Opens the case screen.
export function CaseRow({ c }: { c: Case }) {
  return (
    <Link className="case" href={`/case/${c.id}`}>
      <div className="row"><span>{c.from} → {c.to}</span><span>{naira(c.amount)}</span></div>
      <small>{TYPE_LABEL[c.type] ?? c.type} · {caseRef(c) || 'no reference'} · {ago(c.sentAt)}</small>
      <span className={`chip ${statusColor(c)}`}>{statusText(c)}</span>
    </Link>
  )
}
