export const naira = (n: number) => '₦' + n.toLocaleString('en-NG')

export function ago(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

// A length of time: "14 min", "3h 20m", "2d 4h"
export function dur(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

export const fmt = (ms: number) =>
  new Date(ms).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const fmtDay = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
export const fmtTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

// "1 day", "6 hours", "40 min": a rough, friendly length of time
export function roughly(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000))
  if (m < 60) return `${m} min`
  const h = Math.round(m / 60)
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'}`
  const d = Math.round(h / 24)
  return `${d} day${d === 1 ? '' : 's'}`
}
