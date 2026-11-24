'use client'
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { sendPasswordResetEmail } from 'firebase/auth'
import { AuthCard, AuthField, AuthTop, ErrorLine, SafeLine } from '@/components/AuthParts'
import { authError, errorField, looksLikeEmail } from '@/lib/authErrors'
import { getAuthInstance } from '@/lib/firebase'

const Mail = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

// Forgot password: email a reset link
export default function Forgot() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [errs, setErrs] = useState<{ email?: string; form?: string }>({})

  // Log in passes the email it already has, so they don't type it twice
  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get('email') ?? '')
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return setErrs({ email: 'Enter your email address.' })
    if (!looksLikeEmail(email)) return setErrs({ email: 'Enter a valid email, like ada@gmail.com.' })
    setErrs({})
    setBusy(true)
    try {
      await sendPasswordResetEmail(getAuthInstance(), email.trim())
      setSentTo(email.trim())
    } catch (x) {
      setErrs(errorField(x) === 'form' ? { form: authError(x) } : { email: authError(x) })
    }
    setBusy(false)
  }

  return (
    <div className="au">
      <AuthTop title="Reset your password" sub="We'll email you a link to set a new one." />
      <AuthCard>
        <form className="au-form" onSubmit={submit} noValidate>
          <AuthField
            label="Email address"
            icon="mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrs({})
            }}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            error={errs.email}
          />
          <button className="tk-btn" disabled={busy}>
            {busy ? 'Sending…' : sentTo ? 'Send it again' : 'Send reset link'}
          </button>
          <ErrorLine>{errs.form}</ErrorLine>
        </form>
        {sentTo && (
          <div className="au-sent" role="status">
            <span><Mail /></span>
            <p>
              <b>Check your email.</b> We sent a reset link to {sentTo}. It can take a minute, and sometimes lands in spam.
            </p>
          </div>
        )}
      </AuthCard>
      <p className="au-foot">
        Remembered it? <Link href="/login">Back to log in</Link>
      </p>
      <SafeLine />
    </div>
  )
}