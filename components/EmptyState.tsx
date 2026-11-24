import type { ReactNode } from 'react'

// Icons for the empty screens
const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>{children}</svg>
)
export const EMPTY_ICONS = {
  track: (
    <Svg>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </Svg>
  ),
  history: (
    <Svg>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </Svg>
  ),
  bellOk: (
    <Svg>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
      <path d="m9.5 9.5 2 2 3.5-3.5" />
    </Svg>
  ),
  bellOff: (
    <Svg>
      <path d="M6 8a6 6 0 0 1 9.5-4.9M18 8c0 7 3 8 3 8H8" />
      <path d="M6 8c0 3.5-.8 5.6-1.7 6.7" />
      <path d="M10 20a2 2 0 0 0 4 0" />
      <path d="M3 3l18 18" />
    </Svg>
  ),
  filter: <Svg><path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" /></Svg>,
  plus: <Svg><path d="M12 5v14M5 12h14" /></Svg>,
}

// Big empty screen: icon in soft rings, title, one line, then the next step
export function EmptyState({
  icon,
  title,
  text,
  tone = 'green',
  children,
}: {
  icon: ReactNode
  title: string
  text: string
  tone?: 'green' | 'grey'
  children?: ReactNode
}) {
  return (
    <div className="es">
      <span className={`es-ring ${tone}`}><span>{icon}</span></span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  )
}

// Small card for a History filter with nothing in it
export function EmptyFilter({ title, text, onShowAll }: { title: string; text: string; onShowAll: () => void }) {
  return (
    <div className="es-card">
      <span className="es-mini">{EMPTY_ICONS.filter}</span>
      <b>{title}</b>
      <p>{text}</p>
      <button className="es-link" onClick={onShowAll}>Show all cases</button>
    </div>
  )
}