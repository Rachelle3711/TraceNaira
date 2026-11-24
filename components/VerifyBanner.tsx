'use client'
import { useState } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { useAuth } from './AuthProvider'

// Shows a yellow notice until the user clicks the link in their email.
export function VerifyBanner() {
  const { user } = useAuth()
  const [msg, setMsg] = useState('')
  const [, bump] = useState(0) // changing this number forces a redraw
  if (!user || user.emailVerified) return null

  async function resend() {
    try {
      await sendEmailVerification(user!)
      setMsg('Link sent. Check your inbox and spam folder.')
    } catch {
      setMsg('Too many requests. Try again in a few minutes.')
    }
  }

  async function check() {
    await user!.reload() // asks Firebase for the latest version of this user
    bump((n) => n + 1)
    if (!user!.emailVerified) setMsg('Not verified yet.')
  }

  return (
    <div className="verify">
      <b>Verify your email</b>
      <small>We sent a link to {user.email}.</small>
      <div className="two">
        <button onClick={resend}>RESEND</button>
        <button onClick={check}>I'VE VERIFIED</button>
      </div>
      {msg && <small>{msg}</small>}
    </div>
  )
}