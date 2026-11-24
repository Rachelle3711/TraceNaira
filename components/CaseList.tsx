"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Guard } from "@/components/Guard";
import { Path, whereNow } from "@/components/MoneyPath";
import {
  clearCases,
  downloadCsv,
  isRefunded,
  watchCases,
  type Case,
  type ClearWhich,
} from "@/lib/case";
import { dur, naira, roughly } from "@/lib/format";
import { reversalDue } from "@/lib/payments";
import { stats } from "@/lib/stats";
import { useNow } from "@/lib/useNow";
import { EMPTY_ICONS, EmptyFilter, EmptyState } from "@/components/EmptyState";

const FILTERS = ["All", "Open", "Closed"] as const;

const Ic = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    {children}
  </svg>
);
const Dots = () => (
  <svg
    viewBox="0 0 24 24"
    className="ic"
    aria-hidden
    fill="currentColor"
    stroke="none"
  >
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);
const Download = () => (
  <Ic>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Ic>
);
const Bin = () => (
  <Ic>
    <path d="M3.5 6.5h17" />
    <path d="M9 6.5V4.8c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3v1.7" />
    <path d="M5.5 6.5l1 12.6c.1 1 .9 1.9 2 1.9h7c1.1 0 1.9-.8 2-1.9l1-12.6" />
    <path d="M10 11v6M14 11v6" />
  </Ic>
);

function OpenCard({ c, now }: { c: Case; now: number }) {
  const where = whereNow(c, true);
  const failed = c.status === "awaiting_reversal";
  const left = reversalDue(c) - now;
  const [badge, tone, action] = failed
    ? left < 0
      ? [`Overdue by ${roughly(-left)}`, "red", "Escalate"]
      : [`Refund due in ${roughly(left)}`, "amber", "Next steps"]
    : [`Pending · ${dur(now - c.sentAt)}`, "amber", "View"];

  return (
    <Link className="hs-card" href={`/case/${c.id}`}>
      <div className="hs-row">
        <b>
          {c.from} → {c.to}
        </b>
        <b className="hs-amt">{naira(c.amount)}</b>
      </div>
      <Path now={where.now} names={[c.from, "", c.to]} label={where.label} />
      <div className="hs-row">
        <span className={`tk-badge line ${tone}`}>{badge}</span>
        <span className="hs-go">{action} ›</span>
      </div>
    </Link>
  );
}

function ClosedCard({ c }: { c: Case }) {
  const badge = c.notDebited
    ? "Not debited"
    : isRefunded(c)
      ? "Refunded ✓"
      : "Arrived ✓";
  return (
    <Link className="hs-card closed" href={`/case/${c.id}`}>
      <div>
        <b>
          {c.from} → {c.to}
        </b>
        <span className="tk-badge line green">{badge}</span>
      </div>
      <b className="hs-amt">{naira(c.amount)}</b>
    </Link>
  );
}

// The ⋯ button in the header: Export as CSV, Clear history
function Menu({ cases, onClear }: { cases: Case[]; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) =>
      !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", out);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", out);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <span className="hs-menu" ref={box}>
      <button
        className="hs-more"
        aria-label="More"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Dots />
      </button>
      {open && (
        <span className="hs-pop" role="menu">
          <button
            role="menuitem"
            onClick={() => {
              downloadCsv(cases);
              setOpen(false);
            }}
          >
            <Download /> Export as CSV
          </button>
          <span className="hs-pop-line" aria-hidden />
          <button
            role="menuitem"
            className="red"
            onClick={() => {
              setOpen(false);
              onClear();
            }}
          >
            <Bin /> Clear history
          </button>
        </span>
      )}
    </span>
  );
}

// Choose what to clear: only closed cases, or everything
export function ClearSheet({
  cases,
  onPick,
  onClose,
}: {
  cases: Case[];
  onPick: (w: ClearWhich) => void;
  onClose: () => void;
}) {
  const closed = cases.filter((c) => c.status === "resolved").length;
  const open = cases.length - closed;
  const n = (k: number) => `${k} case${k === 1 ? "" : "s"}`;
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
        aria-label="Clear history"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-grip" aria-hidden />
        <span className="hs-bin">
          <Bin />
        </span>
        <h2 className="tk-sheet-h">Clear history</h2>
        <p className="tk-sheet-p">This can&apos;t be undone.</p>
        <button
          className="hs-choice"
          disabled={!closed}
          onClick={() => onPick("closed")}
        >
          <b>Clear closed cases</b>
          <small>
            {closed
              ? `${n(closed)}: arrived, refunded or not debited`
              : "No closed cases yet"}
          </small>
        </button>
        <button className="hs-choice red" onClick={() => onPick("all")}>
          <b>Clear everything</b>
          <small>
            All {n(cases.length)}.
            {open
              ? ` ${open === 1 ? "The open one" : "Open ones"} will stop being tracked.`
              : ""}
          </small>
        </button>
        <button className="tk-link" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// The History tab: every case, newest first
export function CaseList() {
  const { user, loading } = useAuth();
  const now = useNow();
  const owner = user?.uid ?? null;
  const [cases, setCases] = useState<Case[] | null>(null);
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const [clearing, setClearing] = useState(false);
  useEffect(
    () => (loading ? undefined : watchCases(owner, setCases)),
    [loading, owner],
  );

  const all = [...(cases ?? [])].sort((a, b) => b.sentAt - a.sentAt);
  const isOpen = (c: Case) => c.status !== "resolved";
  const shown = all.filter((c) => f === "All" || (f === "Open") === isOpen(c));
  const openCount = all.filter(isOpen).length;
  const { recovered } = stats(all);
  const sub = [
    recovered ? `${naira(recovered)} recovered` : "",
    openCount ? `${openCount} still open` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  async function clear(which: ClearWhich) {
    setClearing(false);
    await clearCases(owner, which);
    setF("All");
  }

  return (
    <Guard>
      <div className="tk">
        <header className="hs-top">
          <div className="hs-head">
            <h1>History</h1>
            {all.length > 0 && (
              <Menu cases={all} onClear={() => setClearing(true)} />
            )}
          </div>
          <p>
            {sub ||
              (all.length
                ? `${all.length} case${all.length === 1 ? "" : "s"}, all closed`
                : "Your cases will show here")}
          </p>
        </header>

        {all.length > 0 && (
          <div className="hs-filters" role="tablist" aria-label="Filter cases">
            {FILTERS.map((x) => (
              <button
                key={x}
                role="tab"
                aria-selected={x === f}
                className={x === f ? "on" : ""}
                onClick={() => setF(x)}
              >
                {x}
              </button>
            ))}
          </div>
        )}

        <div className="hs-list">
          {shown.map((c) =>
            isOpen(c) ? (
              <OpenCard key={c.id} c={c} now={now} />
            ) : (
              <ClosedCard key={c.id} c={c} />
            ),
          )}

          {cases && !all.length && (
            <EmptyState
              icon={EMPTY_ICONS.history}
              title="No cases yet"
              text="Every payment you report is kept here, open and closed, so you always have a record."
            >
              <Link className="tk-btn" href="/report">
                {EMPTY_ICONS.plus} Report a failed transaction
              </Link>
            </EmptyState>
          )}
          {cases && all.length > 0 && !shown.length && (
            <EmptyFilter
              title={f === "Open" ? "No open cases" : "No closed cases"}
              text={
                f === "Open"
                  ? "All your cases are closed."
                  : "None of your cases have closed yet."
              }
              onShowAll={() => setF("All")}
            />
          )}
        </div>

        {!user && all.length > 0 && (
          <p className="tk-save">
            These cases are only on this phone.{" "}
            <Link href="/signup">Create an account</Link> to keep them.
          </p>
        )}
      </div>
      {clearing && (
        <ClearSheet
          cases={all}
          onPick={clear}
          onClose={() => setClearing(false)}
        />
      )}
    </Guard>
  );
}
