'use client'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {Brand } from '@/components/Brand'

// Shared pieces for Log in, Create an account and Forgot password

const Mark = () => (
  <svg viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="6" cy="29" r="2.4" fill="#FFFFFF" />
    <path d="M6 29C12 29 12 15 19 15S24 25 29 22 33 13 34.5 10" stroke="#FFFFFF" strokeWidth="3.4" />
    <circle cx="34.5" cy="9.5" r="3.8" fill="#E8B923" />
  </svg>
)
const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>{children}</svg>
)
const Back = () => <Svg><path d="m15 18-6-6 6-6" /></Svg>
const Eye = ({ off }: { off: boolean }) => (
  <Svg>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </Svg>
)
const Alert = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </Svg>
)

// Icons shown at the start of each field
const ICONS = {
  user: (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  ),
  mail: (
    <Svg>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Svg>
  ),
  phone: (
    <Svg>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </Svg>
  ),
  lock: (
    <Svg>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  ),
}
export type FieldIcon = keyof typeof ICONS

// Green top with back button, logo, title and one line under it
export function AuthTop({ title, sub }: { title: string; sub: string }) {
  const router = useRouter()
  return (
    <header className="au-top">
      <div className="au-bar">
        <button
          type="button"
          className="tk-round"
          aria-label="Back"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
        >
          <Back />
        </button>
       <Brand />
        <span className="au-gap" aria-hidden />
      </div>
      <h1>{title}</h1>
      <p>{sub}</p>
    </header>
  )
}

// A red message with a small warning icon. Sits right under the field (or button) it is about.
export const ErrorLine = ({ children }: { children: ReactNode }) =>
  children ? (
    <span className="au-ferr" role="alert">
      <Alert />
      {children}
    </span>
  ) : null

// A labelled input with an icon. prefix = fixed text in front (e.g. +234).
// Passwords get a show/hide eye. The error shows under this field only.
export function AuthField({
  label,
  icon,
  prefix,
  hint,
  error,
  type,
  id,
  ...p
}: InputHTMLAttributes<HTMLInputElement> & { label: string; icon: FieldIcon; prefix?: string; hint?: string; error?: string }) {
  const [show, setShow] = useState(false)
  const pw = type === 'password'
  const fid = id ?? `f-${label.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <div className="au-field">
      <label className="au-lb" htmlFor={fid}>{label}</label>
      <span className={`au-box${error ? ' bad' : ''}`}>
        <span className="au-ic">{ICONS[icon]}</span>
        {prefix && <span className="au-pre">{prefix}</span>}
        <input {...p} id={fid} type={pw && show ? 'text' : type} aria-invalid={!!error} />
        {pw && (
          <button type="button" className="au-eye" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>
            <Eye off={show} />
          </button>
        )}
      </span>
      {error ? <ErrorLine>{error}</ErrorLine> : hint && <span className="au-hint">{hint}</span>}
    </div>
  )
}

// "or" divider and the Google button that sits under the main button
export function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <>
      <div className="au-or" aria-hidden><span />or<span /></div>
      <button type="button" className="au-google" onClick={onClick} disabled={disabled}>
        <span className="au-g" aria-hidden>
          <img src="/google-g.png" alt="" width={20} height={20} />
        </span>
        Continue with Google
      </button>
    </>
  )
}

export function AuthCard({ children }: { children: ReactNode }) {
  return <div className="au-card">{children}</div>
}

export const SafeLine = () => <p className="au-safe">We never ask for your PIN, OTP or BVN.</p>