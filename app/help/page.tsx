'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Mono } from '@/components/BankPicker'
import { Guard } from '@/components/Guard'
import { DIRECTORY } from '@/lib/bankDirectory'
import { cameFromApp } from '@/lib/navHistory'

// Help: five folded topics. Tap one to open it; only one is open at a time.
// Guests can see it too (bank numbers and safety tips are useful before signing up).

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>{children}</svg>
)
const I = {
  phone: <Svg><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Svg>,
  clock: <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  question: <Svg><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></Svg>,
  shield: <Svg><path d="M12 3 4 6v6c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V6z" /><path d="m9 12 2 2 4-4" /></Svg>,
  mail: <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>,
  search: <Svg><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>,
  down: <Svg><path d="m6 9 6 6 6-6" /></Svg>,
  back: <Svg><path d="m15 18-6-6 6-6" /></Svg>,
}

const TIMES: [string, string][] = [
  ['Transfer, USSD or app', 'Up to 24 hrs'],
  ['ATM at another bank', 'Up to 48 hrs'],
  ['POS or card online', 'Up to 72 hrs'],
  ['Airtime, data or bills', 'Up to 24 hrs'],
]

const FAQS: [string, string][] = [
  [
    'What is a Session ID?',
    'A 30-digit code on the transfer receipt in your bank app. It lets your bank find the exact transfer fast, so add it to your case if you can.',
  ],
  [
    'Why can a refund take up to 24 hours?',
    "That's the CBN deadline, not the usual wait. Most failed transfers come back within minutes. When the automatic refund fails, the bank has to do it by hand, which takes longer, but it must finish within 24 hours.",
  ],
  [
    "I was debited but the receiver didn't get it",
    "The money is usually still on its way or being held by the receiver's bank. Report it on TraceNaira: we'll show where it probably is, what to send your bank and when to call them. Keep your receipt and Session ID.",
  ],
  [
    "I wasn't debited. Is my money safe?",
    "Yes. If your balance didn't go down, no money left your account, even if the app showed an error. If the transfer still says Pending, check your balance again in a few minutes.",
  ],
  [
    'Where do I find my Session ID?',
    "Open the transfer in your bank app's history and tap the receipt. It's labelled Session ID (some apps say Transaction reference or Session number).",
  ],
  [
    'What if the refund deadline passes?',
    "Your case turns overdue and shows what to do: call your bank's customer care, or visit a branch, and ask for a complaint number. Keep your dispute slip and Session ID ready.",
  ],
  [
    'Can TraceNaira move or refund my money?',
    'No. TraceNaira shows where your money probably is and who to contact. Only your bank can move or refund it, and we never ask for your PIN or OTP.',
  ],
  ['Is TraceNaira free?', 'Yes, it is free to use.'],
]

const SHOW_FIRST = 5 // banks shown before "Show all"

type Topic = 'banks' | 'times' | 'faq' | 'safety' | 'contact'

function Section({
  id,
  open,
  onToggle,
  icon,
  title,
  sub,
  children,
}: {
  id: Topic
  open: boolean
  onToggle: (id: Topic) => void
  icon: ReactNode
  title: string
  sub: string
  children: ReactNode
}) {
  return (
    <div className={`hp-sec${open ? ' open' : ''}`} id={id}>
      <button className="hp-top" aria-expanded={open} onClick={() => onToggle(id)}>
        <span className="pf-ic">{icon}</span>
        <span className="pf-txt">
          <b>{title}</b>
          <small>{sub}</small>
        </span>
        <span className="hp-chev">{I.down}</span>
      </button>
      {open && <div className="hp-body">{children}</div>}
    </div>
  )
}

export default function Help() {
  const router = useRouter()
  const [open, setOpen] = useState<Topic | null>(null)
  const [faq, setFaq] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [all, setAll] = useState(false)

  // Profile's "Stay safe" tile links to /help#safety: open that topic straight away
  useEffect(() => {
    const h = window.location.hash.slice(1) as Topic
    if (['banks', 'times', 'faq', 'safety', 'contact'].includes(h)) setOpen(h)
  }, [])

  const toggle = (id: Topic) => setOpen((o) => (o === id ? null : id))
  const back = () => (cameFromApp() ? router.back() : router.push('/'))

  const query = q.trim().toLowerCase()
  const banks = Object.entries(DIRECTORY).filter(([b, c]) => c.phone && b.toLowerCase().includes(query))
  const shown = query || all ? banks : banks.slice(0, SHOW_FIRST)

  return (
    <Guard guest>
      <div className="tk">
        <header className="hs-top hp-head">
          <button className="tk-round" onClick={back} aria-label="Back">{I.back}</button>
          <h1>Help</h1>
        </header>

        <div className="hp-card">
          <Section id="banks" open={open === 'banks'} onToggle={toggle} icon={I.phone} title="Contact your bank" sub={`${banks.length || Object.keys(DIRECTORY).length} banks, tap to call`}>
            <label className="hp-search">
              {I.search}
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your bank" aria-label="Search your bank" />
            </label>
            {shown.map(([b, c]) => (
              <div className="hp-bank" key={b}>
                <Mono name={b} size={36} />
                <span className="pf-txt">
                  <b>{b}</b>
                  <small className="hp-num">{c.show ?? c.phone}</small>
                </span>
                <a className="hp-call" href={`tel:${c.phone}`} aria-label={`Call ${b}`}>{I.phone}</a>
              </div>
            ))}
            {!shown.length && <p className="hp-note">No bank found. Use the Help or Support section in your bank&apos;s app.</p>}
            {!query && !all && banks.length > SHOW_FIRST && (
              <button className="hp-more" onClick={() => setAll(true)}>Show all {banks.length} banks</button>
            )}
            <p className="hp-note">Numbers from each bank&apos;s own website. Never call a number someone sends you.</p>
          </Section>

          <Section id="times" open={open === 'times'} onToggle={toggle} icon={I.clock} title="How long a refund can take" sub="CBN deadlines by payment type">
            {TIMES.map(([t, h]) => (
              <div className="hp-row" key={t}>
                <span>{t}</span>
                <b>{h}</b>
              </div>
            ))}
            <p className="hp-note">These are the latest times allowed. Most refunds come much sooner, often within minutes.</p>
          </Section>

          <Section id="faq" open={open === 'faq'} onToggle={toggle} icon={I.question} title="Frequently asked questions" sub="Session ID, refunds, debits and more">
            {FAQS.map(([question, answer], i) => (
              <div className={`hp-faq${faq === i ? ' open' : ''}`} key={question}>
                <button aria-expanded={faq === i} onClick={() => setFaq(faq === i ? null : i)}>
                  <b>{question}</b>
                  <span className="hp-chev">{I.down}</span>
                </button>
                {faq === i && <p>{answer}</p>}
              </div>
            ))}
          </Section>

          <Section id="safety" open={open === 'safety'} onToggle={toggle} icon={I.shield} title="Stay safe" sub="How to spot a scam">
            <ul className="hp-list">
              <li>TraceNaira is not your bank and can&apos;t move your money.</li>
              <li>Nobody from TraceNaira or your bank will ask for your PIN, OTP, BVN or card details.</li>
              <li>Anyone who calls first offering to &quot;reverse&quot; your money is a scammer. Hang up and call your bank yourself.</li>
              <li>Only use numbers from your bank&apos;s own app or website, like the ones on this page.</li>
            </ul>
          </Section>

          <Section id="contact" open={open === 'contact'} onToggle={toggle} icon={I.mail} title="Contact TraceNaira" sub="tracenaira@gmail.com">
            <p className="hp-text">For problems with the app, feedback, or privacy requests. We can&apos;t see your bank account or move money.</p>
            <a className="tk-btn hp-mail" href="mailto:tracenaira@gmail.com?subject=TraceNaira">Email tracenaira@gmail.com</a>
          </Section>
        </div>
      </div>
    </Guard>
  )
}