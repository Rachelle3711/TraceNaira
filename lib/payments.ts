// Payment types, how long each usually takes, and how long a bank has to reverse a failure.
// Keep all timing numbers in this one file so they are easy to update.

export const TYPES = ['Transfer', 'POS', 'ATM', 'USSD', 'Bills', 'Card online'] as const
export type PayType = (typeof TYPES)[number]

export const TYPE_LABEL: Record<string, string> = {
  Transfer: 'Transfer',
  POS: 'POS',
  ATM: 'ATM',
  USSD: 'USSD',
  Bills: 'Airtime, data or bills',
  'Card online': 'Card online',
  App: 'App', // older cases
}

// Transfers that travel over NIBSS Instant Payment (NIP) and carry a Session ID
export const isNip = (type: string) => type === 'Transfer' || type === 'USSD' || type === 'App'

// Typical time for the money to arrive. Placeholders until there is real data.
export function usual(type: string) {
  return isNip(type)
    ? { text: '10 to 20 min', min: 10, max: 20 }
    : { text: 'up to 24 hrs', min: 0, max: 1440 }
}

// Hours a bank has to reverse a failed payment, counted from when it was sent.
// POS and card online (web): 72 hrs, and ATM at another bank: 48 hrs, from the CBN's
// revised timelines (press release, effective 8 June 2020).
// Transfers and USSD (NIP): 24 hrs, from the CBN circular on instant transfers (13 Sept 2018).
// Bills: 24 hrs is a PLACEHOLDER, there is no specific CBN rule for it.
export function reversalHours(type: string) {
  if (type === 'POS' || type === 'Card online') return 72
  if (type === 'ATM') return 48
  return 24
}

// Same circular: the receiving bank must credit an instant transfer within 60 seconds,
// and is fined for delays beyond 4 minutes. So a transfer should reach the receiver by then.
export const REACH_MINUTES = 4
export const reachBy = (c: { type: string; sentAt: number }) =>
  isNip(c.type) ? c.sentAt + REACH_MINUTES * 60000 : null

// The small print under the estimated times
export function ruleNote(type: string) {
  if (isNip(type)) return 'CBN rules: credit within 4 minutes, failed transfers refunded within 24 hours.'
  if (type === 'ATM') return 'CBN rule: failed withdrawals at another bank refunded within 48 hours.'
  if (type === 'POS' || type === 'Card online') return 'CBN rule: failed POS and card payments refunded within 72 hours.'
  return 'Usually refunded within 24 hours.'
}

export const reversalDue = (c: { type: string; sentAt: number }) => c.sentAt + reversalHours(c.type) * 3600000

// If the bank hasn't resolved a complaint in 2 weeks, the customer can escalate to the CBN's
// Consumer Protection Department (CBN "How to lodge a complaint").
export const CBN_EMAIL = 'cpd@cbn.gov.ng'
export const BANK_RESOLUTION_DAYS = 14