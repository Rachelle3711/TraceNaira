"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Path, pathNames, whereNow } from "@/components/MoneyPath";
import { contactFor } from "@/lib/bankDirectory";
import { isWallet } from "@/lib/banks";
import {
  isRefunded,
  markFailed,
  markOutcome,
  patchCase,
  setBankAppSays,
  statusColor,
  statusText,
  type Case,
  type Outcome,
  type Owner,
} from "@/lib/case";
import { dur, fmtDay, fmtTime, naira, roughly } from "@/lib/format";
import { bankMessage, proofText } from "@/lib/messages";
import {
  isNip,
  reachBy,
  reversalDue,
  ruleNote,
  TYPE_LABEL,
} from "@/lib/payments";
import { parseSessionId } from "@/lib/sessionId";
import { copyText, shareText } from "@/lib/share";
import { outlook, type Outlook } from "@/lib/timings";
import { withNext } from "@/lib/next";
import { useNow } from "@/lib/useNow";
import { AlertAsk } from '@/components/AlertAsk'

type P = { c: Case; owner: Owner };

const homeHref = (owner: Owner) => (owner ? "/home" : "/");
const HOUR = 3600000;

// "Today, 08:31", "Tomorrow, 08:31" or "21 Nov, 08:31"
export function when(ms: number) {
  const day = (d: number) => new Date(d).toDateString();
  const t = fmtTime(ms);
  if (day(ms) === day(Date.now())) return `Today, ${t}`;
  if (day(ms) === day(Date.now() + 864e5)) return `Tomorrow, ${t}`;
  if (day(ms) === day(Date.now() - 864e5)) return `Yesterday, ${t}`;
  return `${fmtDay(ms)}, ${t}`;
}
// The same, for the middle of a sentence: "today, 08:31", "21 Nov, 08:31"
const whenLower = (ms: number) =>
  when(ms).replace(/^(Today|Tomorrow|Yesterday)/, (w) => w.toLowerCase());

// There are only two ways a stuck payment ends:
// Way 1, it reaches the receiver (the bank app says Successful or Pending)
// Way 2, the sender's bank refunds it (the bank app says Failed)
export function CaseScreen({ c, owner }: P) {
  if (c.status === "resolved") return <Resolved c={c} owner={owner} />;
  if (c.status === "awaiting_reversal") return <Refund c={c} owner={owner} />;
  return <OnItsWay c={c} owner={owner} />;
}

// Status label used on the signed-in home screen
export function Chip({ c, children }: { c: Case; children?: ReactNode }) {
  return (
    <span className={`chip ${statusColor(c)}`}>
      {children ?? statusText(c)}
    </span>
  );
}

/* ---------- icons ---------- */

const Ic = ({ d, children }: { d?: string; children?: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    {d ? <path d={d} /> : children}
  </svg>
);
const Back = () => <Ic d="m15 18-6-6 6-6" />;
const Share = () => (
  <Ic d="M12 15V3M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
);
const Close = () => <Ic d="M6 6l12 12M18 6 6 18" />;
const Chev = () => <Ic d="m9 6 6 6-6 6" />;
const Check = () => <Ic d="m5 12 5 5 9-10" />;
const Info = () => (
  <Ic>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v5h1" />
  </Ic>
);
const Bars = () => <Ic d="M4 19V9M10 19V5M16 19v-7M22 19H2" />;

/* ---------- shared pieces ---------- */

// Green top: back, share, route, amount and the status badge
function Head({
  c,
  badge,
  tone,
  guest,
}: {
  c: Case;
  badge: string;
  tone: "amber" | "red";
  guest?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <header className="tk-top">
      <div className="tk-bar">
        {guest ? (
          <Link className="tk-round" href="/" aria-label="Close">
            <Close />
          </Link>
        ) : (
          <Link
            className="tk-round"
            href="/history"
            aria-label="Back to history"
          >
            <Back />
          </Link>
        )}
        <span>Your case</span>
        <button
          className="tk-round"
          aria-label="Share case"
          onClick={async () =>
            setCopied((await shareText(proofText(c))) === "copied")
          }
        >
          {copied ? <Check /> : <Share />}
        </button>
      </div>
      <p className="tk-route">
        {c.from} → {c.to} · {TYPE_LABEL[c.type] ?? c.type}
      </p>
      <p className="tk-amt">{naira(c.amount)}</p>
      <span className={`tk-badge ${tone}`}>{badge}</span>
    </header>
  );
}

// Guests get one case and see its result, then need an account for everything else.
const Lock = () => (
  <Ic>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Ic>
);
function GuestLock({ items }: { items: string[] }) {
  return (
    <div className="gs-lock">
      <p>
        <Lock /> Keep tracking this case
      </p>
      <ul>
        {items.map((t) => (
          <li key={t}>
            <Check />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
// Pinned where the bottom bar would be. After signing up they come back to this case.
const GuestBar = ({ c }: { c: Case }) => (
  <div className="gs-bar">
    <Link className="tk-btn" href={withNext("/signup", `/case/${c.id}`)}>
      Create an account to keep tracking
    </Link>
    <p>
      Already have one?{" "}
      <Link href={withNext("/login", `/case/${c.id}`)}>Log in</Link>
    </p>
  </div>
);

// Bottom sheet shell, same look as the bank picker
function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="sheet-veil" onClick={onClose}>
      <div
        className="sheet tk-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-grip" aria-hidden />
        {children}
      </div>
    </div>
  );
}

// A row in the estimate box
function Row({
  label,
  value,
  sub,
  red,
}: {
  label: string;
  value: string;
  sub?: string;
  red?: boolean;
}) {
  return (
    <div className="tk-est-row">
      <span>{label}</span>
      <span>
        <b>{value}</b>
        {sub && <small className={red ? "red" : ""}>{sub}</small>}
      </span>
    </div>
  );
}

// "Of 34 Opay → FCMB transfers still pending at 3 min, most arrived within 15 min."
// Only shows once enough similar cases are in the shared pool.
function CrowdLine({ c, elapsedMin }: { c: Case; elapsedMin: number }) {
  const [o, setO] = useState<Outlook | null>(null);
  const bucket = Math.floor(elapsedMin / 5) * 5; // look again every 5 minutes, not every tick
  useEffect(() => {
    let live = true;
    outlook(c, bucket)
      .then((r) => live && setO(r))
      .catch(() => live && setO(null));
    return () => {
      live = false;
    };
  }, [c, bucket]);
  if (!o) return null;
  const what = isNip(c.type) ? "transfers" : "payments";
  const ended = o.outcome === "received" ? "arrived" : "were refunded";
  return (
    <div className="tk-crowd">
      <Bars />
      <span>
        <b>
          Of {o.n} {c.from} → {c.to} {what} still pending at{" "}
          {dur(bucket * 60000)}, most {ended} within {dur(o.within * 60000)}.
        </b>{" "}
        From TraceNaira users.
      </span>
    </div>
  );
}

// Step 1 when something needs chasing: the message to the sender's bank
function MessageStep({
  c,
  owner,
  title,
  text,
  sidNote,
}: P & { title: string; text: string; sidNote: string }) {
  const [copied, setCopied] = useState(false);
  const [sid, setSid] = useState(false);
  const msg = bankMessage(c);
  const contact = contactFor(c.from);

  async function copy() {
    setCopied(await copyText(msg));
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="tk-step on">
      <div className="tk-step-top">
        <span className="tk-num">1</span>
        <b>{title}</b>
      </div>
      <p>{text}</p>
      {(contact.whatsapp || contact.email) && (
        <div className="tk-contacts">
          {contact.whatsapp && (
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`}
            >
              WhatsApp
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}?subject=${encodeURIComponent("Failed transaction")}&body=${encodeURIComponent(msg)}`}
            >
              Email
            </a>
          )}
        </div>
      )}
      {isNip(c.type) &&
        (c.sessionId ? (
          <button className="tk-sid set" onClick={() => setSid(true)}>
            <span>
              <Check /> Session ID added
            </span>
            <small>…{c.sessionId.slice(-8)}</small>
          </button>
        ) : (
          <button className="tk-sid" onClick={() => setSid(true)}>
            <span>
              + Add Session ID <em>{sidNote}</em>
            </span>
            <small>
              <Chev />
            </small>
          </button>
        ))}
      <button className="tk-btn" onClick={copy}>
        {copied ? "Copied ✓" : "Copy message"}
      </button>
      {sid && (
        <SessionSheet c={c} owner={owner} onClose={() => setSid(false)} />
      )}
    </div>
  );
}

// Step 2: wallets (few or no branches) → call support after 1 hour;
// banks → visit a branch once the CBN deadline passes
function SupportStep({ c, now, way }: { c: Case; now: number; way: 1 | 2 }) {
  const wallet = isWallet(c.from);
  const due = reversalDue(c);
  const at = wallet ? c.sentAt + HOUR : due;
  const ready = now >= at;
  const [open, setOpen] = useState(ready);
  useEffect(() => {
    if (ready) setOpen(true);
  }, [ready]);
  const contact = contactFor(c.from);

  const action = wallet
    ? `Call ${c.from}'s support line`
    : `Visit a ${c.from} branch`;
  const wait = wallet ? "in 1 hour" : `by ${whenLower(due)}`;
  const title = ready
    ? `${action} now`
    : `${way === 1 ? "Still not there" : "Not back"} ${wait}? ${action}`;

  return (
    <div
      className={`tk-step fold${open ? " open" : ""}${ready ? " late" : ""}`}
    >
      <button
        className="tk-step-top"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="tk-num">2</span>
        <b>{title}</b>
        <Chev />
      </button>
      {open && (
        <>
          <p>
            {wallet
              ? contact.show
                ? `Their customer care line is ${contact.show}. `
                : `Find the number in the ${c.from} app under Help or Support. `
              : "Take your dispute slip, your Session ID if you have it, and a valid ID. "}
            {wallet ? "Have your dispute slip and Session ID ready, and " : ""}
            {wallet ? "ask" : "Ask"} for a complaint number.
            {!wallet && contact.show
              ? ` You can also call them first on ${contact.show}.`
              : ""}
          </p>
          {contact.phone && (
            <div className="tk-contacts">
              <a href={`tel:${contact.phone}`}>Call {c.from}</a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Way 1: on its way to the receiver ---------- */

// How fast refunds usually come, shown before the CBN deadline so the deadline doesn't read as the normal wait
function usually(type: string) {
  if (isNip(type)) return "Most failed transfers come back within minutes.";
  if (type === "ATM") return "Many come back the same day.";
  return "Many come back sooner than the deadline.";
}
function OnItsWay({ c, owner }: P) {
  const now = useNow();
  const [ask, setAsk] = useState<null | Outcome | "neither">(null);
  const elapsed = now - c.sentAt;
  const reach = reachBy(c); // when the receiving bank should have credited it (transfers only)
  const due = reversalDue(c);
  const late = reach ? now > reach : now > due;
  const where = whereNow(c);
  const nip = isNip(c.type);

  const why =
    c.bankAppSays === "successful"
      ? `${c.from} says it went through, so ${c.to} most likely has it but hasn't credited it yet.`
      : !nip
        ? `${c.from} debited you but ${c.to} hasn't confirmed it yet.`
        : late
          ? `${c.from} hasn't confirmed it yet, and it's taking longer than it should.`
          : `${c.from} hasn't confirmed it yet. Most transfers arrive within minutes.`;

  const guest = !owner;

  return (
    <div className={`tk${guest ? " guest" : ""}`}>
      <Head
        c={c}
        tone="amber"
        badge={`Pending · ${dur(elapsed)}`}
        guest={guest}
      />

      <section className="tk-card">
        <p className="tk-tag">WHERE YOUR MONEY IS</p>
        <Path
          size="lg"
          now={where.now}
          names={pathNames(c)}
          label={where.label}
        />
        <p className="tk-why">{why}</p>
        <p className="tk-warn">Don&apos;t send it again yet.</p>
        <div className="tk-est">
          {reach && (
            <Row
              label={
                late
                  ? `${c.to} should have credited it by`
                  : `Should reach ${c.to} by`
              }
              value={when(reach)}
              sub={
                late
                  ? `Overdue by ${roughly(now - reach)}`
                  : `in ${roughly(Math.max(60000, reach - now))}`
              }
              red={late}
            />
          )}
          <Row label="If it fails, back by" value={when(due)} />
        </div>
        <p className="tk-rule">{ruleNote(c.type)}</p>
        <CrowdLine c={c} elapsedMin={Math.floor(elapsed / 60000)} />
      </section>
      {owner && <AlertAsk c={c} uid={owner} />}

      {guest && (
        <>
          <GuestLock
            items={[
              "Tell us when it arrives or comes back, and we'll close the case",
              `Get the message to ${c.from} ready the moment it's late`,
              "See this case on any phone, and report more cases",
            ]}
          />
          <GuestBar c={c} />
        </>
      )}

      {!guest && late && (
        <>
          <p className="tk-h">IT&apos;S LATE</p>
          <MessageStep
            c={c}
            owner={owner}
            title={`Send a message to ${c.from}`}
            text={`It should have reached ${c.to} by now. ${c.from} must chase it with ${c.to}. We wrote the message, paste it in ${c.from}'s in-app chat.`}
            sidNote={`(${c.from} needs it)`}
          />
          <SupportStep c={c} now={now} way={1} />
        </>
      )}

      {!guest && (
        <>
          <p className="tk-h">WHERE IS THE MONEY NOW?</p>
          <div className="tk-stack">
            <button className="tk-btn grn" onClick={() => setAsk("received")}>
              The receiver got it
            </button>
            <button className="tk-btn ol" onClick={() => setAsk("refunded")}>
              It came back to me
            </button>
            <button className="tk-btn soft" onClick={() => setAsk("neither")}>
              Neither yet
            </button>
          </div>
          <div className="tk-tip">
            <Info />
            <span>
              <b>Receiver says they haven&apos;t got it?</b> Ask them to check
              their balance or statement, not just SMS alerts. Don&apos;t send
              the money again.
            </span>
          </div>
        </>
      )}

      {ask === "neither" && (
        <NeitherSheet c={c} owner={owner} onClose={() => setAsk(null)} />
      )}
      {(ask === "received" || ask === "refunded") && (
        <TimeSheet
          c={c}
          owner={owner}
          outcome={ask}
          onClose={() => setAsk(null)}
        />
      )}
    </div>
  );
}

// "Neither yet": the bank app's status may have changed since the report
function NeitherSheet({ c, owner, onClose }: P & { onClose: () => void }) {
  const opts: [string, string, () => unknown][] = [
    [
      "Successful",
      `${c.from} sent it to ${c.to}`,
      () => setBankAppSays(owner, c.id, "successful"),
    ],
    [
      "Still pending",
      "No final answer yet",
      () => setBankAppSays(owner, c.id, "pending"),
    ],
    ["Failed", `${c.from} owes you a refund`, () => markFailed(owner, c.id)],
  ];
  const current =
    c.bankAppSays === "successful" ? "Successful" : "Still pending";
  return (
    <Sheet label="What does your bank app say now?" onClose={onClose}>
      <h2 className="tk-sheet-h">What does your bank app say now?</h2>
      <p className="tk-sheet-p">
        Open this transfer in {c.from}. Its status may have changed since you
        reported.
      </p>
      <div
        className="tk-opts"
        role="radiogroup"
        aria-label="What does your bank app say now?"
      >
        {opts.map(([title, sub, act]) => (
          <button
            key={title}
            type="button"
            role="radio"
            aria-checked={title === current}
            className={`rp-opt${title === current ? " on" : ""}`}
            onClick={async () => {
              await act();
              onClose();
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
      <p className="tk-note">
        Tap one. We&apos;ll keep watching the deadlines.
      </p>
    </Sheet>
  );
}

// After "The receiver got it" or "It came back to me": when did it happen?
// The timing goes into the anonymous shared pool so estimates get better.
const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function TimeSheet({
  c,
  owner,
  outcome,
  onClose,
}: P & { outcome: Outcome; onClose: () => void }) {
  const [earlier, setEarlier] = useState(false);
  const [value, setValue] = useState(toLocal(Date.now()));
  const [busy, setBusy] = useState(false);
  const picked = new Date(value).getTime();
  const bad =
    earlier &&
    (Number.isNaN(picked) ||
      picked < c.sentAt - 60000 ||
      picked > Date.now() + 60000);
  const verb = outcome === "received" ? "arrive" : "come back";

  async function save() {
    if (bad) return;
    setBusy(true);
    await markOutcome(
      owner,
      c,
      outcome,
      earlier ? Math.max(picked, c.sentAt) : Date.now(),
    );
    onClose();
  }

  return (
    <Sheet label={`What time did it ${verb}?`} onClose={onClose}>
      <span className="tk-sheet-ic ok">
        <Check />
      </span>
      <h2 className="tk-sheet-h">What time did it {verb}?</h2>
      <p className="tk-sheet-p">
        This helps TraceNaira estimate better for everyone. We only keep the
        timing, not your details.
      </p>
      <div
        className="tk-opts"
        role="radiogroup"
        aria-label={`What time did it ${verb}?`}
      >
        <button
          type="button"
          role="radio"
          aria-checked={!earlier}
          className={`rp-opt${!earlier ? " on" : ""}`}
          onClick={() => setEarlier(false)}
        >
          <i />
          <span>
            <b>Just now</b>
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={earlier}
          className={`rp-opt${earlier ? " on" : ""}`}
          onClick={() => setEarlier(true)}
        >
          <i />
          <span>
            <b>Earlier</b>
            <small>Pick the time</small>
          </span>
        </button>
      </div>
      {earlier && (
        <input
          className="tk-dt"
          type="datetime-local"
          value={value}
          min={toLocal(c.sentAt)}
          max={toLocal(Date.now())}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Date and time"
        />
      )}
      {bad && (
        <p className="tk-bad">Pick a time between when you sent it and now.</p>
      )}
      <button className="tk-btn" disabled={busy || bad} onClick={save}>
        {busy ? "Saving…" : "Save"}
      </button>
    </Sheet>
  );
}

/* ---------- Way 2: the sender's bank refunds it ---------- */

function Refund({ c, owner }: P) {
  const now = useNow();
  const [ask, setAsk] = useState(false);
  const due = reversalDue(c);
  const overdue = now > due;
  const where = whereNow(c);
  const what =
    c.type === "ATM" ? "withdrawal" : isNip(c.type) ? "transfer" : "payment";

  const guest = !owner;

  return (
    <div className={`tk${guest ? " guest" : ""}`}>
      <Head
        c={c}
        tone="red"
        badge={`Failed · ${c.from} will refund you`}
        guest={guest}
      />

      <section className="tk-card">
        <p className="tk-tag">WHERE YOUR MONEY IS</p>
        <Path
          size="lg"
          now={where.now}
          names={pathNames(c)}
          label={where.label}
        />
        <p className="tk-why">
          {overdue
            ? `The ${what} failed and ${c.from} is late refunding you.`
            : `The ${what} failed, so ${c.from} will refund you. ${usually(c.type)}`}
        </p>
        <div className="tk-est">
          <Row
            label={overdue ? "Refund was due by" : "Must be back by"}
            value={when(due)}
            sub={
              overdue
                ? `Overdue by ${roughly(now - due)}`
                : `${roughly(due - now)} left`
            }
            red={overdue}
          />
        </div>
        <p className="tk-rule">
          {overdue
            ? `${c.from} has missed the CBN deadline. Use step 2 below.`
            : `That's the CBN deadline, not the usual wait. ${ruleNote(c.type)}`}
        </p>
        <CrowdLine c={c} elapsedMin={Math.floor((now - c.sentAt) / 60000)} />
      </section>
       {owner && <AlertAsk c={c} uid={owner} />}
       
      <p className="tk-h">WHAT TO DO NOW</p>
      <MessageStep
        c={c}
        owner={owner}
        title={`Send a message to ${c.from}`}
        text={`We wrote the message. Paste it in ${c.from}'s in-app chat.`}
        sidNote="(optional)"
      />
      {guest ? (
        <>
          <GuestLock
            items={[
              "Tell us when the refund lands, and we'll close the case",
              `The next step if ${c.from} misses the deadline`,
              "See this case on any phone, and report more cases",
            ]}
          />
          <GuestBar c={c} />
        </>
      ) : (
        <>
          <SupportStep c={c} now={now} way={2} />
          <div className="tk-two">
            <button className="tk-btn grn" onClick={() => setAsk(true)}>
              It came back to me
            </button>
            <Link className="tk-btn ol" href={`/case/${c.id}/journey`}>
              Dispute slip
            </Link>
          </div>
        </>
      )}

      {ask && (
        <TimeSheet
          c={c}
          owner={owner}
          outcome="refunded"
          onClose={() => setAsk(false)}
        />
      )}
    </div>
  );
}

// Optional: the 30-digit NIBSS Session ID from the receipt. It goes into the message to the bank.
function SessionSheet({ c, owner, onClose }: P & { onClose: () => void }) {
  const [raw, setRaw] = useState(c.sessionId ?? "");
  const r = parseSessionId(raw);

  async function save() {
    if (!r.valid) return;
    await patchCase(owner, c.id, {
      sessionId: r.id,
      sentAt: r.sentAt.getTime(),
      sentAtSource: "session_id",
    });
    onClose();
  }

  return (
    <Sheet label="Add Session ID" onClose={onClose}>
      <div className="sheet-head">
        <h2>Add Session ID</h2>
        <button
          type="button"
          className="round-btn"
          aria-label="Close"
          onClick={onClose}
        >
          <Close />
        </button>
      </div>
      <p className="tk-sheet-p">
        We&apos;ll add it to your message to {c.from}. Banks find a transfer
        faster with it.
      </p>
      <label className="tk-field">
        <span>Session ID</span>
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="30 digits"
          autoFocus
        />
      </label>
      {r.valid ? (
        <p className="tk-ok">
          ✓ Left {c.from} and reached NIBSS {whenLower(r.sentAt.getTime())}
        </p>
      ) : (
        r.reason && <p className="tk-bad">{r.reason}</p>
      )}
      <div className="tk-hint">
        <b>Where to find it:</b> open the transfer in your bank app&apos;s
        history, or its receipt. Look for a 30-digit number.
      </div>
      <button className="tk-btn" disabled={!r.valid} onClick={save}>
        Add to message
      </button>
    </Sheet>
  );
}

/* ---------- Closed ---------- */

function Resolved({ c, owner }: P) {
  const [copied, setCopied] = useState(false);
  const back = isRefunded(c);
  const end = c.resolvedAt ?? Date.now();
  const title = c.notDebited
    ? "Case closed"
    : back
      ? "Your money is back"
      : "Your money arrived";

  return (
    <div className="tk">
      <header className="tk-top center">
        <div className="tk-bar end">
          <Link className="tk-round" href={homeHref(owner)} aria-label="Close">
            <Close />
          </Link>
        </div>
        <span className="tk-done">
          <Check />
        </span>
        <h1 className="tk-title">{title}</h1>
        <p className="tk-amt">{naira(c.amount)}</p>
      </header>

      <section className="tk-card">
        {c.notDebited ? (
          <p className="tk-why" style={{ marginTop: 0 }}>
            No money left your account, so nothing was lost. You can safely try
            the payment again.
          </p>
        ) : (
          <>
            {!back && <Path size="lg" now={3} names={pathNames(c)} />}
            <div className={`tk-kv${back ? " flush" : ""}`}>
              <div>
                <span>Sent</span>
                <b>{when(c.sentAt)}</b>
              </div>
              <div>
                <span>{back ? "Came back" : "Arrived"}</span>
                <b>{when(end)}</b>
              </div>
              <div>
                <span>Took</span>
                <b>{dur(end - c.sentAt)}</b>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="tk-two">
        <Link className="tk-btn" href={homeHref(owner)}>
          Back to home
        </Link>
        {!c.notDebited && (
          <button
            className="tk-btn ol"
            onClick={async () =>
              setCopied((await shareText(proofText(c))) === "copied")
            }
          >
            {copied ? "Copied ✓" : "Share receipt"}
          </button>
        )}
      </div>
      {!owner && <GuestBar c={c} />}
    </div>
  );
}
