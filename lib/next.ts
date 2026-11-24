// Where to go after logging in or signing up: the ?next= part of the address.
// Only paths inside this app are allowed, so a link can't send people to another site.
export function getNext(fallback = '/home') {
  if (typeof window === 'undefined') return fallback
  const n = new URLSearchParams(window.location.search).get('next') || ''
  return n.startsWith('/') && !n.startsWith('//') ? n : fallback
}

export const withNext = (path: string, next: string) => `${path}?next=${encodeURIComponent(next)}`
