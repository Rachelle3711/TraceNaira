const messages: Record<string, string> = {
    'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-login-credentials': 'Wrong email or password.',
  'auth/user-not-found': 'No account with that email.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/email-already-in-use': 'That email already has an account. Try logging in.',
  'auth/weak-password': 'Use at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
  'auth/network-request-failed': 'No connection. Check your network and try again.',
  'auth/operation-not-allowed': 'Email sign-up is switched off in Firebase. Enable it under Authentication.',
  'auth/configuration-not-found': 'Authentication is not set up in Firebase yet. Click Get started.',
  'auth/invalid-api-key': 'The API key in .env.local is wrong.',
  'auth/unauthorized-domain': "Google sign-in isn't switched on for this web address yet.",
  'auth/cancelled-popup-request': '',
  'auth/popup-closed-by-user': '',
}

export function authError(e: unknown): string {
  const code = (e as { code?: string }).code ?? ''
  return code in messages ? messages[code] : `Something went wrong (${code || 'unknown'}). Try again.`
}

// Which field an error belongs under, so it shows in the right place
export type ErrorField = 'email' | 'password' | 'form'
export function errorField(e: unknown): ErrorField {
  const code = (e as { code?: string }).code ?? ''
  if (code === 'auth/invalid-email' || code === 'auth/email-already-in-use' || code === 'auth/user-not-found') return 'email'
   if (
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    code === 'auth/wrong-password' ||
    code === 'auth/weak-password'
  )
    return 'password'
  return 'form'
}

// Simple checks before sending anything to Firebase
export const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())