import { isRefunded, type Case } from './case'
import { isNip } from './payments'

// Where the money most likely is. We have no live bank feed, so this is worked out from
// what the user told us. 'between' means somewhere from NIBSS to the receiver's bank.
export type Stage = 'none' | 'your_bank' | 'nibss' | 'between' | 'receiver_bank' | 'receiver' | 'network'
export type Confidence = 'confirmed' | 'likely' | 'in_transit'

export const CONFIDENCE_TEXT: Record<Confidence, string> = {
  confirmed: 'CONFIRMED',
  likely: 'MOST LIKELY',
  in_transit: 'IN TRANSIT',
}

// An outage report, e.g. from a status feed. Not wired up yet: pass [] for now.
export type Outage = { bank: string } // bank name as in BANKS, or 'NIBSS'

export type StageResult = { stage: Stage; confidence: Confidence; headline: string; why: string }

export function inferStage(c: Case, outages: Outage[] = []): StageResult {
  if (c.status === 'resolved') {
    if (c.notDebited) return { stage: 'none', confidence: 'confirmed', headline: 'No money left your account', why: 'You checked and were not debited.' }
   return isRefunded(c)
      ? { stage: 'your_bank', confidence: 'confirmed', headline: 'Your money is back', why: 'You confirmed the reversal.' }
      : { stage: 'receiver', confidence: 'confirmed', headline: 'Your money arrived', why: 'You confirmed it arrived.' }
  }

  if (c.status === 'awaiting_reversal' || c.bankAppSays === 'failed') {
    return {
      stage: 'your_bank',
      confidence: 'likely',
      headline: `Waiting for ${c.from} to reverse it`,
      why: `The payment did not complete, so ${c.from} still holds your money and owes you a reversal.`,
    }
  }

  // Card, POS, ATM and bill payments don't go through NIBSS Instant Payment
  if (!isNip(c.type)) {
    return {
      stage: 'network',
      confidence: 'in_transit',
      headline: 'Not confirmed yet',
      why: `${c.from} debited you but the payment has not been confirmed by ${c.to}. Failed card payments are usually reversed automatically.`,
    }
  }

  if (c.bankAppSays === 'successful') {
    return {
      stage: 'receiver_bank',
      confidence: 'likely',
      headline: `With ${c.to}, not yet credited`,
      why: `${c.from} says the transfer went through, so ${c.to} most likely has the money but has not credited the account yet.`,
    }
  }

  // Pending, not sure, or an older case with no answer: use outage reports if there are any
  const down = outages.find((o) => o.bank === c.to || o.bank === 'NIBSS')
  if (down) {
    return {
      stage: down.bank === 'NIBSS' ? 'nibss' : 'receiver_bank',
      confidence: 'likely',
      headline: `Delayed at ${down.bank}`,
      why: `Delays are being reported at ${down.bank} right now.`,
    }
  }

  return {
    stage: 'between',
    confidence: 'in_transit',
    headline: 'Between the banks',
    why: `${c.from} has not confirmed it yet. The money is somewhere between NIBSS and ${c.to}. Only the banks can see exactly where.`,
  }
}
