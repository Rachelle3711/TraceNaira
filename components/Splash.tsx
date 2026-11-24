// Brand splash: the logo box appears, its line draws itself, the gold dot pops in,
// then "TraceNaira" slides in beside the logo and its gold dot pops in (about 2.3 seconds).
// still: no animation. Used while a page quietly checks your login, so it doesn't replay every time.
export function Splash({ still = false }: { still?: boolean }) {
  return (
    <div className={`splash${still ? ' still' : ''}`} role="img" aria-label="TraceNaira">
      <div className="sp-brand">
        <span className="sp-box">
          <svg className="sp-icon" viewBox="0 0 40 40" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle className="sp-start" cx="6" cy="29" r="2.4" fill="currentColor" />
            <path
              className="sp-line"
              pathLength={60}
              d="M6 29C12 29 12 15 19 15S24 25 29 22 33 13 34.5 10"
              stroke="currentColor"
              strokeWidth="3.4"
            />
            <circle className="sp-dot" cx="34.5" cy="9.5" r="3.8" fill="#E8B923" />
          </svg>
        </span>
        <span className="sp-name">TraceNaira<i className="sp-stop" aria-hidden /></span>
      </div>
    </div>
  )
}