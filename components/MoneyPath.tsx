import type { Case } from '@/lib/case'
import { isNip } from '@/lib/payments'
import { inferStage } from '@/lib/stage'

// The three dots: sender's bank, between the banks (NIBSS), receiving side.
// now = the dot where the money is (3 = finished, every dot done).
// label = replaces the name under the "now" dot, e.g. "Back with Opay" or "In transit".
export function Path({
  now,
  names,
  label,
  size = 'sm',
}: {
  now: number
  names: [string, string, string]
  label?: string
  size?: 'sm' | 'lg'
}) {
  const dot = (i: number) => (i < now ? 'd' : i === now ? 'n' : '')
  return (
    <div className={`path ${size}`}>
      <div className="wl-path" aria-hidden>
        <i className={dot(0)} />
        <b className={now > 0 ? 'd' : ''} />
        <i className={dot(1)} />
        <b className={now > 1 ? 'd' : ''} />
        <i className={dot(2)} />
      </div>
      <div className="wl-names">
        {names.map((n, i) => (
          <span key={i} className={i === now && label ? 'now' : undefined}>
            {i === now && label ? label : n}
          </span>
        ))}
      </div>
    </div>
  )
}

export const pathNames = (c: Case): [string, string, string] => [c.from, isNip(c.type) ? 'NIBSS' : '', c.to]

// Where the money is, as a dot on the path. short = the wording for small cards.
export function whereNow(c: Case, short = false): { now: number; label: string } {
  if (c.status === 'resolved') return { now: 3, label: '' }
  if (c.status === 'awaiting_reversal') return { now: 0, label: short ? c.from : `Back with ${c.from}` }
  if (isNip(c.type) && inferStage(c).stage === 'receiver_bank') return { now: 2, label: `With ${c.to}` }
  return { now: 1, label: short || !isNip(c.type) ? 'In transit' : 'Between the banks' }
}