'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { AuthCard, AuthField, AuthTop, ErrorLine, GoogleButton, SafeLine } from '@/components/AuthParts'
import { useAuth } from '@/components/AuthProvider'
import { authError, errorField, looksLikeEmail } from '@/lib/authErrors'
import { getAuthInstance, getDb, googleProvider } from '@/lib/firebase'
import { getNext, withNext } from '@/lib/next'

// Nigerian mobile number without the leading 0: 10 digits, e.g. 803 123 4567
const phoneDigits = (v: string) => v.replace(/\D/g, '').replace(/^234/, '').replace(/^0/, '').slice(0, 10)

// One message per place, each under the thing it is about
type Key = 'name' | 'email' | 'phone' | 'password' | 'agree' | 'form' | 'google'
type Errs = Partial<Record<Key, string>>

export default function Signup() {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errs, setErrs] = useState<Errs>({})
  const creating = useRef(false) // stops the redirect below from firing mid sign-up
  const [next, setNextPath] = useState('/home') // read after load to avoid a server/browser mismatch
  useEffect(() => setNextPath(getNext()), [])

  // Signed in with Google (or already signed in): go back to where they came from
  useEffect(() => {
    if (user && !creating.current) router.replace(getNext())
  }, [user, router])

  const digits = phoneDigits(phone)
  const clear = (k: Key) => setErrs((x) => ({ ...x, [k]: undefined }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found: Errs = {}
    if (!name.trim()) found.name = 'Enter your full name.'
    if (!email.trim()) found.email = 'Enter your email address.'
    else if (!looksLikeEmail(email)) found.email = 'Enter a valid email, like ada@gmail.com.'
    if (digits.length !== 10) found.phone = 'Enter 10 digits, like 803 123 4567.'
    if (password.length < 8 || !/\d/.test(password)) found.password = 'Use 8 or more characters with a number.'
    if (!agree) found.agree = 'Tick this box to continue.'
    setErrs(found)
    if (Object.keys(found).length) return

    setBusy(true)
    creating.current = true
    try {
      const { user: u } = await createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password)
      await updateProfile(u, { displayName: name.trim() })
      await sendEmailVerification(u).catch(() => {}) // a failed email shouldn't block sign-up
      await setDoc(doc(getDb(), 'users', u.uid), {
        name: name.trim(),
        phone: `+234${digits}`,
        createdAt: serverTimestamp(),
      })
      router.replace(getNext()) // back to their case if they came from "Save your case"
    } catch (x) {
      creating.current = false
      setErrs({ [errorField(x)]: authError(x) })
      setBusy(false)
    }
  }

  async function google() {
    if (!agree) return setErrs({ agree: 'Tick this box to continue.' })
    setErrs({})
    try {
      await signInWithPopup(getAuthInstance(), googleProvider())
    } catch (x) {
      if ((x as { code?: string }).code === 'auth/popup-blocked') return signInWithRedirect(getAuthInstance(), googleProvider())
      setErrs({ google: authError(x) })
    }
  }

  return (
    <div className="au">
      <AuthTop title="Create your account" sub="Save your cases and see them on any device." />
      <AuthCard>
        <form className="au-form" onSubmit={submit} noValidate>
          <AuthField
            label="Full name"
            icon="user"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clear('name')
            }}
            placeholder="e.g. Ada Okafor"
            autoComplete="name"
            error={errs.name}
          />
          <AuthField
            label="Email address"
            icon="mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clear('email')
            }}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            error={errs.email}
          />
          <AuthField
            label="Phone number"
            icon="phone"
            type="tel"
            prefix="+234"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              clear('phone')
            }}
            placeholder="803 123 4567"
            autoComplete="tel-national"
            inputMode="numeric"
            error={errs.phone}
          />
          <AuthField
            label="Password"
            icon="lock"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clear('password')
            }}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            hint="Use 8 or more characters with a number."
            error={errs.password}
          />
          <div className="au-field">
            <label className={`au-check${errs.agree ? ' bad' : ''}`}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked)
                  clear('agree')
                }}
              />
              <span>
               I agree to the <Link href="/terms" target="_blank">Terms</Link> and <Link href="/privacy" target="_blank">Privacy policy</Link>
              </span>
            </label>
            <ErrorLine>{errs.agree}</ErrorLine>
          </div>
          <button className="tk-btn" disabled={busy}>{busy ? 'Creating your account…' : 'Create account'}</button>
          <ErrorLine>{errs.form}</ErrorLine>
        </form>
        <GoogleButton onClick={google} />
        <ErrorLine>{errs.google}</ErrorLine>
      </AuthCard>
      <p className="au-foot">
        Already have an account? <Link href={withNext('/login', next)}>Log in</Link>
      </p>
      <SafeLine />
    </div>
  )
}