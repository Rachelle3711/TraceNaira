import Link from 'next/link'

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)

// Profile tab for people without an account: sign up or log in, plus help that works without one
export function GuestProfile() {
  const next = encodeURIComponent('/profile')
  return (
    <div className="pg">
      <header className="pg-top">
        <span className="pg-avatar"><UserIcon /></span>
        <h1 className="pg-h">Your profile</h1>
        <p className="pg-sub">Save your cases and see them on any device.</p>
      </header>
      <div className="pg-card">
        <Link className="wl-btn" href={`/signup?next=${next}`}>Create an account</Link>
        <Link className="wl-btn ol" href={`/login?next=${next}`}>Log in</Link>
      </div>
      <nav className="pg-list" aria-label="Help">
        <Link href="/help">Help and contacts<span aria-hidden>›</span></Link>
        <Link href="/help#safety">Stay safe from scams<span aria-hidden>›</span></Link>
        <Link href="/help">Terms and privacy<span aria-hidden>›</span></Link>
      </nav>
    </div>
  )
}