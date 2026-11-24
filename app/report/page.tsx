"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BankPicker, Mono } from "@/components/BankPicker";
import { Guard } from "@/components/Guard";
import { addCase, statusText, type BankAppSays, type Case } from "@/lib/case";
import { naira } from "@/lib/format";
import { watchGuest } from "@/lib/guest";
import { withNext } from "@/lib/next";
import { isNip, TYPE_LABEL, TYPES, type PayType } from "@/lib/payments";
import { readSettings } from "@/lib/settings";

/* ---------- small helpers ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowTime = () => new Date().toTimeString().slice(0, 5);
// Whole naira only: anything after a dot (kobo) is dropped instead of being glued onto the amount
const withCommas = (v: string) =>
  v
    .split(".")[0]
    .replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const MAX_AMOUNT = 1_000_000_000; // ₦1 billion: anything bigger is almost certainly a typo
const BIG_AMOUNT = 5_000_000; // above this, ask them to double-check
const QUICK = [5000, 10000, 20000, 50000];

// Every case is tracked from the sending bank to the receiving bank.
// For an ATM, the receiving bank is the bank that owns the ATM.
const TO_LABEL = (t: PayType) =>
  t === "ATM" ? "The ATM's bank" : "Receiving bank";

// What the sender's bank app shows. This decides the way it will end:
// Successful or Pending → it should reach the receiver; Failed → the bank refunds it.
type Says = Exclude<BankAppSays, "unsure"> | "not_debited";
const SAYS: [Says, string, string][] = [
  ["successful", "Successful", "But the receiver hasn't got it"],
  ["pending", "Pending", "Still processing, or no clear answer"],
  ["failed", "Failed", "And I was debited"],
  ["not_debited", "I wasn't debited", "No money left my account"],
];

type When = "now" | "today" | "yesterday" | "pick";
const WHEN: [When, string][] = [
  ["now", "Just now"],
  ["today", "Earlier today"],
  ["yesterday", "Yesterday"],
  ["pick", "Pick a date and time"],
];

/* ---------- icons ---------- */

const I = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    {d}
  </svg>
);
const TYPE_ICON: Record<PayType, React.ReactNode> = {
  Transfer: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  POS: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2" />
      <path d="M9 6.5h6M9 11h.01M12 11h.01M15 11h.01M9 14.5h.01M12 14.5h.01M15 14.5h.01" />
    </>
  ),
  ATM: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M7 21h10M12 9v4M10 11h4" />
    </>
  ),
  USSD: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2" />
      <path d="M10 18.5h4M9.5 8h5" />
    </>
  ),
  Bills: <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21zM10 8h4M10 12h4" />,
  "Card online": (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
};
const Back = () => <I d={<path d="m15 18-6-6 6-6" />} />;
const Close = () => <I d={<path d="M6 6l12 12M18 6 6 18" />} />;
const Chev = () => <I d={<path d="m6 9 6 6 6-6" />} />;
const Swap = () => (
  <I d={<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />} />
);
const Tick = () => <I d={<path d="m5 12 5 5 9-10" />} />;

/* ---------- the flow ---------- */

export default function Report() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<PayType | null>(null);
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [location, setLocation] = useState("");
  const [picking, setPicking] = useState<null | "from" | "to">(null);
  const [says, setSays] = useState<Says | null>(null);
  const [when, setWhen] = useState<When>("now");
  const [date, setDate] = useState(dateStr(new Date()));
  const [time, setTime] = useState(nowTime());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null); // shows the "Starting to track" screen  // Guests get one case. If this phone already has one, they need an account to report more.
  const [guestCase, setGuestCase] = useState<Case | null>(null);

  // "Default sending bank" from Profile fills in the sending bank
  useEffect(() => {
    const d = readSettings().defaultBank;
    if (d) setFrom((f) => f || d);
  }, []);
  useEffect(
    () =>
      watchGuest((list) =>
        setGuestCase(
          list.find((c) => c.status !== "resolved") ?? list[0] ?? null,
        ),
      ),
    [],
  );

  const n = Number(amount.replace(/,/g, ""));
  const t = type ?? "Transfer";
  const amountOk = n > 0 && n <= MAX_AMOUNT;
  const banksOk = !!from && !!to.trim() && (t !== "ATM" || !!location.trim());

  function goBack() {
    setErr("");
    if (step > 1) setStep(step - 1);
    else router.back();
  }
  const close = () => router.push(user ? "/home" : "/");

  function pickType(x: PayType) {
    setType(x);
    setStep(2);
  }

  // The time they sent it, from the "When" answer
  function sentAt(): Date | null {
    if (when === "now") return new Date();
    const d = new Date();
    if (when === "yesterday") d.setDate(d.getDate() - 1);
    const day = when === "pick" ? date : dateStr(d);
    const [y, mo, dd] = day.split("-").map(Number);
    const [h, m] = time.split(":").map(Number);
    if (!y || Number.isNaN(h)) return null;
    return new Date(y, mo - 1, dd, h, m, 0, 0);
  }

  async function start() {
    const s = sentAt();
    if (!s) return setErr("Choose the date and time.");
    if (s.getTime() > Date.now() + 60000)
      return setErr("That time is in the future.");
    setErr("");
    setBusy(true);
    try {
      const saved = await addCase(user?.uid ?? null, {
        amount: n,
        from,
        to: to.trim(),
        type: t,
        ref: "",
        sentAt: s.getTime(),
        sentAtSource: "user",
        bankAppSays: says as BankAppSays,
        ...(t === "ATM" ? { location: location.trim() } : {}),
      });
      setSavedId(saved.id);
    } catch {
      setErr(
        "Could not save your report. Check your connection and try again.",
      );
      setBusy(false);
    }
  }

  // After saving: show the short "Starting to track" screen, then open the case
  useEffect(() => {
    if (!savedId) return;
    const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => router.replace(`/case/${savedId}`),
      quick ? 600 : 2600,
    );
    return () => clearTimeout(timer);
  }, [savedId, router]);

  if (savedId)
    return <Starting amount={n} from={from} to={to} nip={isNip(t)} />;
  if (!loading && !user && guestCase) return <OneCase c={guestCase} />;
  // No money left the account: nothing to track, so nothing is saved
  if (says === "not_debited")
    return (
      <NothingLost
        amount={n}
        from={from}
        again={() => {
          setSays(null);
          setStep(1);
          setType(null);
          setAmount("");
          setFrom("");
          setTo("");
        }}
        home={user ? "/home" : "/"}
      />
    );

  const questions = [
    "What kind of payment?",
    "How much did you send?",
    "Which banks?",
    "What does your bank app say?",
    "When did you send it?",
  ];

  return (
    <Guard guest nav={false}>
      <div className="rp">
        <div className="rp-top">
          <div className="rp-bar">
            <button
              type="button"
              className="round-btn"
              aria-label="Back"
              onClick={goBack}
            >
              <Back />
            </button>
            <span className="rp-step">Step {step} of 5</span>
            <button
              type="button"
              className="round-btn"
              aria-label="Close"
              onClick={close}
            >
              <Close />
            </button>
          </div>
          <div className="rp-progress" aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= step ? "on" : ""} />
            ))}
          </div>
          <h1 className="rp-q">{questions[step - 1]}</h1>
          {step === 3 && (
            <p className="rp-sub">
              The bank you sent from, and the bank you sent to.
            </p>
          )}
          {step === 4 && (
            <p className="rp-sub">
              Open this transfer in your bank app and check its status.
            </p>
          )}
        </div>

        {/* 1 · Payment type */}
        {step === 1 && (
          <>
            <div className="rp-tiles">
              {TYPES.map((x) => (
                <button
                  type="button"
                  key={x}
                  className={`rp-tile${type === x ? " on" : ""}`}
                  onClick={() => pickType(x)}
                >
                  <span className="rp-tile-ic">
                    <I d={TYPE_ICON[x]} />
                  </span>
                  {TYPE_LABEL[x]}
                </button>
              ))}
            </div>
            <p className="rp-hint">Tap one to continue</p>
          </>
        )}

        {/* 2 · Amount */}
        {step === 2 && (
          <>
            <div className="rp-amount">
              <label className="rp-amt">
                <span>₦</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  placeholder="0"
                  aria-label="Amount in naira"
                  value={amount}
                  onChange={(e) => setAmount(withCommas(e.target.value))}
                />
              </label>
              {n > MAX_AMOUNT && (
                <p className="ferr" style={{ margin: "10px 0 0" }}>
                  That looks too large. Check the number of zeros.
                </p>
              )}
              {n >= BIG_AMOUNT && n <= MAX_AMOUNT && (
                <p className="rp-check">Please double-check: {naira(n)}</p>
              )}
              <div className="rp-quick">
                {QUICK.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setAmount(withCommas(String(q)))}
                  >
                    {naira(q)}
                  </button>
                ))}
              </div>
            </div>
            <div className="rp-foot">
              <button
                type="button"
                className="wl-btn"
                disabled={!amountOk}
                onClick={() => setStep(3)}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* 3 · Sending bank and receiving bank */}
        {step === 3 && (
          <>
            <div className="rp-banks">
              <span className="rp-lb">Sending bank</span>
              <BankBox value={from} onClick={() => setPicking("from")} />
              <div className="rp-swap">
                <button
                  type="button"
                  className="round-btn soft"
                  aria-label="Swap banks"
                  onClick={() => {
                    setFrom(to);
                    setTo(from);
                  }}
                >
                  <Swap />
                </button>
              </div>
              <span className="rp-lb">{TO_LABEL(t)}</span>
              <BankBox value={to} onClick={() => setPicking("to")} />
              {t === "ATM" && (
                <>
                  <span className="rp-lb" style={{ marginTop: 12 }}>
                    Where is the ATM?
                  </span>
                  <input
                    className="rp-text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Allen Avenue, Ikeja"
                    aria-label="Where is the ATM?"
                  />
                </>
              )}
            </div>
            <div className="rp-foot">
              <button
                type="button"
                className="wl-btn"
                disabled={!banksOk}
                onClick={() => setStep(4)}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* 4 · What the bank app says */}
        {step === 4 && (
          <>
            <div
              className="rp-opts"
              role="radiogroup"
              aria-label="What does your bank app say?"
            >
              {SAYS.map(([v, title, sub]) => (
                <button
                  type="button"
                  key={v}
                  role="radio"
                  aria-checked={says === v}
                  className={`rp-opt${says === v ? " on" : ""}`}
                  onClick={() => {
                    setSays(v);
                    if (v !== "not_debited") setStep(5);
                  }}
                >
                  <i />
                  <span>
                    <b>{title}</b>
                    <small>{sub}</small>
                  </span>
                </button>
              ))}
            </div>
            <p className="rp-hint">Tap one to continue</p>
          </>
        )}

        {/* 5 · When */}
        {step === 5 && (
          <>
            <div
              className="rp-opts"
              role="radiogroup"
              aria-label="When did you send it?"
            >
              {WHEN.map(([v, text]) => (
                <button
                  type="button"
                  key={v}
                  role="radio"
                  aria-checked={when === v}
                  className={`rp-when${when === v ? " on" : ""}`}
                  onClick={() => {
                    setWhen(v);
                    setErr("");
                  }}
                >
                  {text}
                  {when === v && <Tick />}
                </button>
              ))}
              {when !== "now" && (
                <div className="rp-dt">
                  {when === "pick" && (
                    <input
                      type="date"
                      value={date}
                      max={dateStr(new Date())}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label="Date"
                    />
                  )}
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    aria-label="Time"
                  />
                </div>
              )}
            </div>
            <div className="rp-foot">
              {err && <p className="err">{err}</p>}
              <button
                type="button"
                className="wl-btn"
                disabled={busy}
                onClick={start}
              >
                {busy ? "Starting…" : "Start tracking"}
              </button>
              <p className="wl-note" style={{ fontSize: 12 }}>
                We never ask for your PIN, OTP or BVN.
              </p>
            </div>
          </>
        )}
      </div>

      {picking && (
        <BankPicker
          title={picking === "from" ? "Sending bank" : TO_LABEL(t)}
          value={picking === "from" ? from : to}
          onClose={() => setPicking(null)}
          onPick={(b) => {
            if (picking === "from") setFrom(b);
            else setTo(b);
            setPicking(null);
          }}
        />
      )}
    </Guard>
  );
}

function BankBox({ value, onClick }: { value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`rp-bank${value ? " set" : ""}`}
      onClick={onClick}
    >
      {value ? (
        <Mono name={value} />
      ) : (
        <span className="rp-bank-empty" aria-hidden />
      )}
      <span className="rp-bank-name">{value || "Choose bank"}</span>
      <Chev />
    </button>
  );
}

/* ---------- "Starting to track" ---------- */

function Starting({
  amount,
  from,
  to,
  nip,
}: {
  amount: number;
  from: string;
  to: string;
  nip: boolean;
}) {
  return (
    <div className="st-screen" role="status" aria-live="polite">
      <p className="st-route">
        {naira(amount)} · {from} → {to}
      </p>
      <h1 className="st-h">Starting to track your money</h1>
      <div className="st-path" aria-hidden>
        <i className="d" />
        <b />
        <i className="mid" />
        <b className="dash" />
        <i className="end" />
        <u />
      </div>
      <div className="st-names" aria-hidden>
        <span>{from}</span>
        <span>{nip ? "NIBSS" : ""}</span>
        <span>{to}</span>
      </div>
      <ul className="st-list">
        <li style={{ animationDelay: ".3s" }}>
          <span>
            <Tick />
          </span>
          Case saved
        </li>
        <li style={{ animationDelay: ".9s" }}>
          <span>
            <Tick />
          </span>
          Usual timing worked out
        </li>
        <li style={{ animationDelay: "1.5s" }}>
          <span>
            <Tick />
          </span>
          Next steps ready
        </li>
      </ul>
    </div>
  );
}

/* ---------- "I wasn't debited": nothing was lost ---------- */

function NothingLost({
  amount,
  from,
  again,
  home,
}: {
  amount: number;
  from: string;
  again: () => void;
  home: string;
}) {
  return (
    <Guard guest>
      <div className="tk">
        <header className="tk-top center">
          <div className="tk-bar end">
            <Link className="tk-round" href={home} aria-label="Close">
              <Close />
            </Link>
          </div>
          <span className="tk-done">
            <Tick />
          </span>
          <h1 className="tk-title">Nothing was lost</h1>
          <p className="tk-amt">{naira(amount)}</p>
        </header>
        <section className="tk-card">
          <p className="tk-why" style={{ marginTop: 0 }}>
            No money left your {from} account, so there&apos;s nothing to track.
            You can safely try the payment again.
          </p>
          <div className="tk-hint">
            <b>Check again in a few minutes.</b> Debit alerts can arrive late.
            If {naira(amount)} leaves your account later, report it again.
          </div>
        </section>
        <div className="tk-two" style={{ marginTop: 18 }}>
          <Link className="tk-btn" href={home}>
            Back to home
          </Link>
          <button type="button" className="tk-btn ol" onClick={again}>
            Report another
          </button>
        </div>
      </div>
    </Guard>
  );
}

/* ---------- Guests: one case only ---------- */

const Lock = () => (
  <I
    d={
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    }
  />
);

function OneCase({ c }: { c: Case }) {
  return (
    <Guard guest nav={false}>
      <div className="gs-gate">
        <Link className="round-btn" href="/" aria-label="Close">
          <Close />
        </Link>
        <span className="gs-gate-ic">
          <Lock />
        </span>
        <h1>Create a free account to track more than one case</h1>
        <p>
          You&apos;re already tracking {naira(c.amount)} from {c.from} to {c.to}
          . An account keeps it safe and lets you report as many as you need.
        </p>
        <Link className="gs-case" href={`/case/${c.id}`}>
          <span>
            <b>Your case · {naira(c.amount)}</b>
            <small>
              {statusText(c)} · {c.from} → {c.to}
            </small>
          </span>
          View ›
        </Link>
        <div className="gs-gate-foot">
          <Link className="wl-btn" href={withNext("/signup", "/report")}>
            Create an account
          </Link>
          <Link className="wl-btn ol" href={withNext("/login", "/report")}>
            Log in
          </Link>
        </div>
      </div>
    </Guard>
  );
}
