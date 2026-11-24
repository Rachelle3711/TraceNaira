"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Path, pathNames, whereNow } from "@/components/MoneyPath";
import { Splash } from "@/components/Splash";
import { statusColor, statusText, type Case } from "@/lib/case";
import { dur, naira } from "@/lib/format";
import { watchGuest } from "@/lib/guest";
import { withNext } from "@/lib/next";
import { Brand } from "@/components/Brand";

// The white TraceNaira mark used in the green header
const Mark = () => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="6" cy="29" r="2.4" fill="#FFFFFF" />
    <path
      d="M6 29C12 29 12 15 19 15S24 25 29 22 33 13 34.5 10"
      stroke="#FFFFFF"
      strokeWidth="3.4"
    />
    <circle cx="34.5" cy="9.5" r="3.8" fill="#E8B923" />
  </svg>
);

const Chevron = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
);

function statusLine(c: Case, now: number) {
  if (c.status === "resolved") return "resolved";
  if (c.status === "awaiting_reversal") return "waiting for reversal";
  return `pending ${dur(now - c.sentAt)}`;
}

export default function Start() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [splash, setSplash] = useState(true);
  const [guestCase, setGuestCase] = useState<Case | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2600);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!splash && !loading && user) router.replace("/home");
  }, [splash, loading, user, router]);

  // A case reported on this phone without an account: the newest open one, else the newest
  useEffect(
    () =>
      watchGuest((list) =>
        setGuestCase(
          list.find((c) => c.status !== "resolved") ?? list[0] ?? null,
        ),
      ),
    [],
  );

  // Keep the splash up while the timer runs, while Firebase checks login, or while redirecting
  if (splash || loading || user) return <Splash />;

  /* After the first report: their own case, then create an account or log in */
  if (guestCase) {
    const c = guestCase;
    const where = whereNow(c);
    const next = `/case/${c.id}`;
    return (
      <div className="wl">
        <header className="wl-top">
          <div className="wl-bar">
            <Brand />
          </div>
          <p className="wl-lb">Your case</p>
          <Link className="wl-amt" href={next}>
            {naira(c.amount)}
            <Chevron />
          </Link>
          <Link className="wl-route" href={next}>
            {c.from} → {c.to} · {statusLine(c, Date.now())} ›
          </Link>
        </header>

        <Link className="wl-card" href={next}>
          <div className="wl-row">
            <span className="wl-tag">WHERE YOUR MONEY IS</span>
            <span className={`chip ${statusColor(c)}`}>{statusText(c)}</span>
          </div>
          <Path now={where.now} names={pathNames(c)} label={where.label} />
          <span className="wl-go">Track it →</span>
        </Link>

        <div className="wl-foot">
          <p className="wl-note">Save your case to see it on any device.</p>
          <Link className="wl-btn" href={withNext("/signup", next)}>
            Create an account
          </Link>
          <Link className="wl-btn ol" href={withNext("/login", next)}>
            Log in
          </Link>
        </div>
      </div>
    );
  }

  /* First visit */
  return (
    <div className="wl">
      <header className="wl-top">
        <div className="wl-bar">
          <Brand />
          <Link className="wl-pill" href="/login">
            Log in
          </Link>
        </div>
        <h1 className="wl-h">Know where your money is.</h1>
        <p className="wl-sub">
          Track a failed or stuck transfer in 30 seconds.
        </p>
      </header>

      <div className="wl-card">
        <div className="wl-row">
          <span className="wl-tag">EXAMPLE</span>
          <span className="st red">WAITING FOR REVERSAL</span>
        </div>
        <div className="wl-row">
          <span className="wl-from">Opay → FCMB</span>
          <span className="wl-big">₦20,000</span>
        </div>
        <Path now={2} names={["Opay", "NIBSS", "FCMB"]} />
      </div>

      <div className="wl-foot">
        <Link className="wl-btn" href="/report">
          Report a failed transaction
        </Link>
        <p className="wl-note">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
