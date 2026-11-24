'use client'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const Logo = () => (
  <svg viewBox="0 0 24 24" className="ic">
    <path d="M4 19C8 19 8 9 12 9S15 16 18 14 20 8 20.5 6" />
    <circle cx="4" cy="19" r="1.2" stroke="none" fill="currentColor" />
    <circle cx="20.5" cy="5.5" r="2.2" stroke="none" fill="#E8B923" />
  </svg>
)

const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="ic"><path d="m15 18-6-6 6-6" /></svg>
)
export const ShareIcon = () => (
  <svg viewBox="0 0 24 24" className="ic"><path d="M12 15V3M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
)
export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="ic"><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const HelpIcon = () => (
  <svg viewBox="0 0 24 24" className="ic"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></svg>
)
export const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className="ic"><path d="M12 3 4 6v6c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
)

// action = an optional button or link on the right (share, close, help)
type BarProps = { label: string; title: string; href?: string; root?: boolean; action?: ReactNode }

// root = a tab screen (no back button). href = go to a fixed page. Otherwise go back.
export function TopBar({ label, title, href, root, action }: BarProps) {
  const router = useRouter()
  return (
    <header className="bar">
      {root ? (
        <span className="ib" style={{ visibility: 'hidden' }} />
      ) : href ? (
        <Link className="ib" aria-label="Back" href={href}><BackIcon /></Link>
      ) : (
        <button className="ib" aria-label="Back" onClick={() => router.back()}><BackIcon /></button>
      )}
      <div className="tt"><small>{label}</small><b>{title}</b></div>
      {action ?? <span className="ib" style={{ visibility: 'hidden' }} />}
    </header>
  )
}

// error = message shown under the field in red
export function Field({ label, type, error, id, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [show, setShow] = useState(false)
  const pw = type === 'password'
  return (
    <label id={id}>
      <span className="lb">{label.toUpperCase()}</span>
      <div className={`fld${error ? ' bad' : ''}`}>
        <input {...p} type={pw && show ? 'text' : type} aria-invalid={!!error} />
        {pw && <button type="button" className="lb" onClick={() => setShow(!show)}>{show ? 'HIDE' : 'SHOW'}</button>}
      </div>
      {error && <p className="ferr">{error}</p>}
    </label>
  )
}
