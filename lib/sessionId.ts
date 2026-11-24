// Reads a NIBSS (NIP) Session ID: the 30-digit number on interbank transfer receipts.
// Digits 7 to 18 are the moment the bank started the transfer, as YYMMDDHHMMSS in
// Nigerian time (WAT, UTC+1, no daylight saving). Source: Moniepoint/Monnify engineering blog.
// The first 6 digits usually identify the sending institution; we keep them but don't rely on them yet.

export type SessionIdResult =
  | { valid: true; id: string; institutionCode: string; sentAt: Date }
  | { valid: false; reason: string }

export function parseSessionId(raw: string): SessionIdResult {
  const id = raw.replace(/\D/g, '')
  if (!id) return { valid: false, reason: '' }
  if (id.length !== 30) return { valid: false, reason: `A Session ID has 30 digits. This one has ${id.length}.` }

  const [yy, mo, dd, hh, mi, ss] = id.slice(6, 18).match(/../g)!.map(Number)
  const sane = mo >= 1 && mo <= 12 && dd >= 1 && dd <= 31 && hh < 24 && mi < 60 && ss < 60
  // WAT is UTC+1, so subtract 1 hour to get UTC. Date.UTC handles the day rolling back.
  const sentAt = new Date(Date.UTC(2000 + yy, mo - 1, dd, hh - 1, mi, ss))
  const ageDays = (Date.now() - sentAt.getTime()) / 864e5

  if (!sane || ageDays < -0.01 || ageDays > 120)
    return { valid: false, reason: 'The date inside this Session ID looks wrong. Check you copied all of it.' }

  return { valid: true, id, institutionCode: id.slice(0, 6), sentAt }
}
