'use client'
import { useEffect, useRef, useState } from 'react'
import { BANK_GROUPS, POPULAR_BANKS, shortBank } from '@/lib/banks'
import {BANK_LOGOS } from '@/lib/bankLogos'

// The bank's logo, or its first letter when we don't have the logo (or it fails to load)
export function Mono({ name, size = 40 }: { name: string; size?: number }) {
  const [broken, setBroken] = useState(false)
  const src = BANK_LOGOS[name]
  if (src && !broken)
    return <img className="mono logo" src={src} width={size} height={size} alt="" loading="lazy" onError={() => setBroken(true)} />
  return (
    <span className="mono" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {name[0]}
    </span>
  )
}

const Search = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
const Close = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
)
const Tick = () => (
  <svg viewBox="0 0 24 24" className="ic tick" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
)

// Bottom sheet: search, popular banks as tiles, then the full list in sections
export function BankPicker({
  title = 'Choose bank',
  value,
  onPick,
  onClose,
}: {
  title?: string
  value: string
  onPick: (bank: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const query = q.trim().toLowerCase()
  const groups = BANK_GROUPS.map((g) => ({ ...g, banks: g.banks.filter((b) => b.toLowerCase().includes(query)) })).filter(
    (g) => g.banks.length
  )

  useEffect(() => {
    input.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="sheet-veil" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <span className="sheet-grip" aria-hidden />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="round-btn" aria-label="Close" onClick={onClose}><Close /></button>
        </div>
        <label className="sheet-search">
          <Search />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search banks and wallets" aria-label="Search banks" />
        </label>

        <div className="sheet-body">
          {!query && (
            <>
              <p className="sheet-sec">POPULAR</p>
              <div className="pop-grid">
                {POPULAR_BANKS.map((b) => (
                  <button type="button" key={b} className={`pop${b === value ? ' on' : ''}`} onClick={() => onPick(b)}>
                    <Mono name={b} size={48} />
                    {shortBank(b)}
                  </button>
                ))}
              </div>
            </>
          )}
          {groups.map((g) => (
            <div key={g.label}>
              <p className="sheet-sec">{g.label.toUpperCase()}</p>
              {g.banks.map((b) => (
                <button type="button" key={b} className="bank-row" onClick={() => onPick(b)} aria-pressed={b === value}>
                  <Mono name={b} size={36} />
                  <span>{b}</span>
                  {b === value && <Tick />}
                </button>
              ))}
            </div>
          ))}
          {!groups.length && <p className="sheet-empty">No bank called &quot;{q}&quot;. Check the spelling.</p>}
        </div>
      </div>
    </div>
  )
}