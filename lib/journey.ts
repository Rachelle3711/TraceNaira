import { isRefunded, type Case } from './case'
import { fmt, naira } from './format'
import { isNip, reversalDue, usual } from './payments'
import { inferStage, type Outage } from './stage'

export type Tag = 'YOU REPORTED' | 'YOUR BANK APP' | 'MOST LIKELY' | 'IN TRANSIT' | 'ESTIMATE'
export type Step = { title: string; sub: string; state: 'd' | 'n' | 'f'; tag?: Tag; at?: string }
// state: d = done, n = where the money is (two n steps in a row = it's somewhere in that span), f = future

const S = (title: string, sub: string, state: Step['state'], tag?: Tag, at?: string): Step =>
  ({ title, sub, state, tag, at })

export { reversalDue }

export function journey(c: Case, now: number, outages: Outage[] = []) {
  const elapsed = (c.resolvedAt ?? now) - c.sentAt
  const u = usual(c.type)
  const late = c.status === 'processing' && elapsed > u.max * 60000
  const due = reversalDue(c)
  const where = inferStage(c, outages)

  const sentNote = c.sentAtSource === 'session_id' ? `${fmt(c.sentAt)} · time from Session ID` : fmt(c.sentAt)
  const debit = S(`You sent ${naira(c.amount)}`, `${c.from} debited your account`, 'd', 'YOU REPORTED', sentNote)
  const done = isNip(c.type) ? S('Credit confirmed', 'Receiver gets the money', 'f') : S('Payment confirmed', `${c.to} confirms it`, 'f')

  let steps: Step[]

  if (c.status === 'resolved') {
    if (c.notDebited) {
      steps = [S('Not debited', 'No money left your account', 'd', 'YOU REPORTED', fmt(c.resolvedAt ?? now))]
    } else {
      steps = [debit]
      if (isRefunded(c) && c.failedAt) steps.push(S('Did not arrive', `${c.to} never got it`, 'd', 'YOU REPORTED', fmt(c.failedAt)))
      steps.push(
        isRefunded(c)
          ? S('Money returned', `${c.from} reversed the debit`, 'd', 'YOU REPORTED', fmt(c.resolvedAt ?? now))
          : S('Arrived', `${c.to} received the money`, 'd', 'YOU REPORTED', fmt(c.resolvedAt ?? now))
      )
    }
  } else if (c.status === 'awaiting_reversal') {
    steps = [
      debit,
      S('Did not arrive', `${c.to} never got it`, 'd', 'YOU REPORTED', fmt(c.failedAt ?? now)),
      S('Reversal due', `Waiting for ${c.from} to reverse the debit`, 'n', 'ESTIMATE', `By ${fmt(due)}`),
      S('Money returned', 'The debit comes back to you', 'f'),
    ]
  } else if (!isNip(c.type)) {
    steps = [debit, S('Waiting for confirmation', `${c.to} has not confirmed it`, 'n', 'IN TRANSIT'), done]
  } else if (where.stage === 'receiver_bank' && c.bankAppSays === 'successful') {
    steps = [
      debit,
      S('Accepted through NIBSS', `${c.from} says the transfer went through`, 'd', 'YOUR BANK APP'),
      S(`With ${c.to}`, late ? 'Taking longer than usual to credit' : 'Has the money, not yet credited', 'n', 'MOST LIKELY', 'Now'),
      done,
    ]
  } else if (where.stage === 'nibss') {
    steps = [debit, S('At NIBSS', 'Delays reported on the interbank switch', 'n', 'MOST LIKELY', 'Now'), S(`Awaiting ${c.to}`, `${c.to} credits the account`, 'f'), done]
  } else if (where.stage === 'receiver_bank') {
    steps = [debit, S('Passed NIBSS', 'Entered the interbank network', 'd', 'ESTIMATE'), S(`With ${c.to}`, `Delays reported at ${c.to}`, 'n', 'MOST LIKELY', 'Now'), done]
  } else {
    // We can't tell which of the two middle stages it's at, so both are shown as the current span
    steps = [
      debit,
      S('NIBSS switch', 'Interbank network', 'n', 'IN TRANSIT'),
      S(c.to, late ? 'Taking longer than usual' : 'Receiving bank', 'n', 'IN TRANSIT'),
      done,
    ]
  }

  return { steps, where, elapsed, late, u, due }
}
