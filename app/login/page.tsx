'use client'
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { AuthCard, AuthField, AuthTop, ErrorLine, GoogleButton, SafeLine } from '@/components/AuthParts'
import { useAuth } from '@/components/AuthProvider'
import { authError, errorField, looksLikeEmail } from '@/lib/authErrors'
import { getAuthInstance, googleProvider } from '@/lib/firebase'
import { getNext, withNext } from '@/lib/next'

// One message per place: under the email, under the password, under Log in, or under Google
type Errs = { email?: string; password?: string; form?: string; google?: string }

export default function Login() {
  const { user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [errs, setErrs] = useState<Errs>({})
  const [next, setNextPath] = useState('/home') // read after load to avoid a server/browser mismatch
  useEffect(() => setNextPath(getNext()), [])

  // After logging in, go back to where they came from (e.g. a case reported as a guest)
  useEffect(() => {
    if (user) router.replace(getNext())
  }, [user, router])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found: Errs = {}
    if (!email.trim()) found.email = 'Enter your email address.'
    else if (!looksLikeEmail(email)) found.email = 'Enter a valid email, like ada@gmail.com.'
    if (!password) found.password = 'Enter your password.'
    setErrs(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password)
    } catch (x) {
      setErrs({ [errorField(x)]: authError(x) })
      setBusy(false)
    }
  }

  async function google() {
    setErrs({})
    try {
      await signInWithPopup(getAuthInstance(), googleProvider())
    } catch (x) {
      if ((x as { code?: string }).code === 'auth/popup-blocked') return signInWithRedirect(getAuthInstance(), googleProvider())
      setErrs({ google: authError(x) })
    }
  }

  const forgot = `/forgot${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`

  return (
    <div className="au">
      <AuthTop title="Welcome back" sub="Log in to see your cases on any device." />
      <AuthCard>
        <form className="au-form" onSubmit={submit} noValidate>
          <AuthField
            label="Email address"
            icon="mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrs((x) => ({ ...x, email: undefined }))
            }}
            placeholder="you@example.com"
            autoComplete="username"
            inputMode="email"
            error={errs.email}
          />
          <AuthField
            label="Password"
            icon="lock"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrs((x) => ({ ...x, password: undefined }))
            }}
            placeholder="Your password"
            autoComplete="current-password"
            error={errs.password}
          />
          <Link className="au-forgot" href={forgot}>Forgot password?</Link>
          <button className="tk-btn" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <ErrorLine>{errs.form}</ErrorLine>
        </form>
        <GoogleButton onClick={google} />
        <ErrorLine>{errs.google}</ErrorLine>
      </AuthCard>
      <p className="au-foot">
        New here? <Link href={withNext('/signup', next)}>Create an account</Link>
      </p>
      <SafeLine />
    </div>
  )
}