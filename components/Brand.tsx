// The TraceNaira logo for green headers: the mark in a gold-edged box, the name, and a gold dot.
// Same look as the splash, smaller.
export function Brand() {
  return (
    <span className="tn-brand" aria-label="TraceNaira">
      <span className="tn-brand-box">
        <svg viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="6" cy="29" r="2.4" fill="#FFFFFF" />
          <path d="M6 29C12 29 12 15 19 15S24 25 29 22 33 13 34.5 10" stroke="#FFFFFF" strokeWidth="3.4" />
          <circle cx="34.5" cy="9.5" r="3.8" fill="#E8B923" />
        </svg>
      </span>
      <span className="tn-brand-name" aria-hidden>TraceNaira<i /></span>
    </span>
  )
}