import { isRefunded, type Case } from './case'

export function stats(cases: Case[]) {
  // Cases closed because the person was never debited don't count as a wait or a recovery
  const done = cases.filter((c) => c.status === 'resolved' && c.resolvedAt && !c.notDebited)
  return {
    // Only money that came back to the sender counts as recovered
    recovered: done.filter(isRefunded).reduce((s, c) => s + c.amount, 0),
    avg: done.length ? done.reduce((s, c) => s + (c.resolvedAt! - c.sentAt), 0) / done.length : 0,
    hasDone: done.length > 0,
  }
}