'use client'
import { useEffect, useState } from 'react'
import type { Case } from '@/lib/case'
import { fmtTime } from '@/lib/format'
import { reachBy } from '@/lib/payments'
import { enablePush, skipAsk, skippedAsk, usePush } from '@/lib/push'
import { useSettings } from '@/lib/settings'

const Bell = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
)
const Share = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" /></svg>
)
const Tick = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
)

// On an open case: asks once to turn on phone alerts. Signed-in users only.
export function AlertAsk({ c, uid }: { c: Case; uid: string }) {
  const [s] = useSettings()
  const [state, setState] = usePush(uid)
  const [hidden, setHidden] = useState(true)
  const [justOn, setJustOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => setHidden(skippedAsk(c.id)), [c.id])

  if (justOn)
    return (
      <div className="al-on" role="status">
        <Tick />
        Alerts are on for this phone. Change them in Profile.
      </div>
    )
  if (hidden || !s.notify || (state !== 'off' && state !== 'ios-install')) return null

  const notNow = () => {
    skipAsk(c.id)
    setHidden(true)
  }

  if (state === 'ios-install')
    return (
      <section className="al-card">
        <div className="al-top">
          <span className="al-ic"><Bell /></span>
          <span>
            <b>Get alerts on your iPhone</b>
            <span>iPhone only sends alerts to apps on your Home Screen. It takes 10 seconds:</span>
          </span>
        </div>
        <ol className="al-steps">
          <li><i>1</i>Tap <Share /> Share in Safari</li>
          <li><i>2</i>Choose <b>Add to Home Screen</b></li>
          <li><i>3</i>Open TraceNaira from there and turn on alerts</li>
        </ol>
        <button className="tk-link al-skip" onClick={notNow}>Not now</button>
      </section>
    )

  const reach = reachBy(c)
  const [title, body] =
    c.status === 'awaiting_reversal'
      ? ['Get an alert about this refund', `We'll tell you 2 hours before ${c.from}'s deadline, and if it's missed.`]
      : reach && Date.now() < reach
        ? ['Get an alert if this is late', `We'll tell you if the money hasn't arrived by ${fmtTime(reach)}, or when a refund is due.`]
        : ['Get alerts about this case', `We'll tell you if it's late, or when a refund is due.`]

  async function turnOn() {
    setErr('')
    setBusy(true)
    try {
      const next = await enablePush(uid, s)
      if (next === 'on') setJustOn(true)
      else if (next === 'denied') setErr('Alerts are blocked. Allow them for this site in your browser settings.')
      setState(next)
    } catch {
      setErr('Could not turn on alerts. Check your connection and try again.')
    }
    setBusy(false)
  }

  return (
    <section className="al-card">
      <div className="al-top">
        <span className="al-ic"><Bell /></span>
        <span>
          <b>{title}</b>
          <span>{body} Quiet from 10pm to 7am.</span>
        </span>
      </div>
      <button className="tk-btn al-btn" onClick={turnOn} disabled={busy}>{busy ? 'Turning on…' : 'Turn on alerts'}</button>
      {err && <p className="al-err">{err}</p>}
      <button className="tk-link al-skip" onClick={notNow}>Not now</button>
    </section>
  )
}