import { caseRef, statusText, type Case } from './case'
import { fmt, fmtDay, fmtTime, naira } from './format'

// What happened, in one sentence, worded for the payment type
function whatHappened(c: Case) {
  const amt = naira(c.amount)
  switch (c.type) {
    case 'POS':
      return `I paid ${amt} by POS at ${c.to}${c.terminalId ? ` (terminal ${c.terminalId})` : ''}${c.cardLast4 ? ` with my card ending ${c.cardLast4}` : ''}. I was debited but the payment did not go through.`
    case 'ATM':
      return `I tried to withdraw ${amt} at the ${c.to} ATM${c.location ? ` at ${c.location}` : ''}. I was debited but no cash came out.`
    case 'Bills':
      return `I paid ${amt} to ${c.to}. I was debited but did not get the airtime, data or bill payment.`
    case 'Card online':
      return `I paid ${amt} online to ${c.to}. I was debited but the payment failed.`
    default:
      return `I sent ${amt} to ${c.to}${c.receiverName ? ` (${c.receiverName})` : ''}. I was debited but the receiver has not got it.`
  }
}

const refLine = (c: Case) =>
  c.sessionId ? ` Session ID: ${c.sessionId}.` : caseRef(c) ? ` Reference: ${caseRef(c)}.` : ''

// What to ask for, depending on what the sender's bank app shows
function ask(c: Case) {
  if (c.status === 'awaiting_reversal' || c.bankAppSays === 'failed')
    return 'Your app shows it failed. Please refund me and send me a complaint case ID.'
  const shows = c.bankAppSays === 'successful' ? 'successful' : 'pending'
  return `Your app shows it as ${shows}. Please trace it with ${c.to} and get it credited, or refund me, and send me a complaint case ID.`
}
// The message the person sends to their bank first
export const bankMessage = (c: Case) =>
  `Hello ${c.from}, on ${fmtDay(c.sentAt)} at ${fmtTime(c.sentAt)} ${whatHappened(c)}${refLine(c)} ${ask(c)}`
// The email to the CBN if the bank doesn't resolve it
export const cbnEmail = (c: Case) => ({
  subject: `Complaint against ${c.from}: unresolved failed ${c.type.toLowerCase()} of ${naira(c.amount)}`,
  body:
    `Dear Director, Consumer Protection Department,\n\n` +
    `On ${fmt(c.sentAt)}, ${whatHappened(c)}${refLine(c)}\n\n` +
    `I reported it to ${c.from} and it has not been resolved. My complaint case ID with ${c.from} is: [add it here].\n\n` +
    `Please help me recover my money. My dispute slip is attached.\n\nThank you.`,
})

// Proof to share with the receiver or anyone else
export const proofText = (c: Case) =>
  [
    `${naira(c.amount)} · ${c.from} → ${c.to} · ${c.type}`,
    `Sent ${fmt(c.sentAt)}`,
    c.sessionId ? `Session ID ${c.sessionId}` : '',
    c.ref ? `Ref ${c.ref}` : '',
    `Status: ${statusText(c)}`,
    'Tracked with TraceNaira',
  ]
    .filter(Boolean)
    .join('\n')
