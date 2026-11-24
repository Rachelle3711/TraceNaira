"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { AuthField, ErrorLine } from "@/components/AuthParts";
import { useAuth } from "@/components/AuthProvider";
import { BankPicker } from "@/components/BankPicker";
import { ClearSheet } from "@/components/CaseList";
import { Guard, initials } from "@/components/Guard";
import {
  clearCases,
  downloadCsv,
  watchCases,
  type Case,
  type ClearWhich,
} from "@/lib/case";
import { getAuthInstance } from "@/lib/firebase";
import { dur, naira } from "@/lib/format";
import { getPhone, removeAccount, saveProfile } from "@/lib/profile";
import { useSettings, type Settings, type Theme } from "@/lib/settings";
import { stats } from "@/lib/stats";
import { disablePush, enablePush, usePush, type PushState } from "@/lib/push";

// Profile, with what used to be Settings. Only for people with an account (guests go to Log in).
export default function ProfilePage() {
  return (
    <Guard>
      <Profile />
    </Guard>
  );
}

/* ---------- icons ---------- */

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    {children}
  </svg>
);
const I = {
  history: (
    <Svg>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </Svg>
  ),
  export: (
    <Svg>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Svg>
  ),
  help: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
    </Svg>
  ),
  shield: (
    <Svg>
      <path d="M12 3 4 6v6c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  ),
  user: (
    <Svg>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  ),
  lock: (
    <Svg>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  ),
  sun: (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  ),
  bell: (
    <Svg>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Svg>
  ),
  bank: (
    <Svg>
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
    </Svg>
  ),
  eye: (
    <Svg>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <path d="M4 4l16 16" />
    </Svg>
  ),
  bin: (
    <Svg>
      <path d="M3.5 6.5h17" />
      <path d="M9 6.5V4.8c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3v1.7" />
      <path d="M5.5 6.5l1 12.6c.1 1 .9 1.9 2 1.9h7c1.1 0 1.9-.8 2-1.9l1-12.6" />
    </Svg>
  ),
  doc: (
    <Svg>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </Svg>
  ),
  privacy: (
    <Svg>
      <path d="M12 3 4 6v6c0 4.4 3.4 8.4 8 9 4.6-.6 8-4.6 8-9V6z" />
      <rect x="9" y="11" width="6" height="5" rx="1" />
      <path d="M10.5 11V9.5a1.5 1.5 0 0 1 3 0V11" />
    </Svg>
  ),
  out: (
    <Svg>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </Svg>
  ),
  close: (
    <Svg>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
};

/* ---------- small pieces ---------- */

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`pf-toggle${on ? " on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <i />
    </button>
  );
}

function Row({
  icon,
  title,
  sub,
  end,
  onClick,
  href,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  end?: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span className="pf-ic">{icon}</span>
      <span className="pf-txt">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
      {end ?? (
        <span className="pf-chev" aria-hidden>
          ›
        </span>
      )}
    </>
  );
  if (href)
    return (
      <Link className="pf-row" href={href}>
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button className="pf-row" onClick={onClick}>
        {inner}
      </button>
    );
  return <div className="pf-row">{inner}</div>;
}

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

const THEMES: [Theme, string][] = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["system", "Match phone"],
];

// +2348031234567 → +234 803 123 4567
const prettyPhone = (p: string) => {
  const d = p.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
  return d.length === 10
    ? `+234 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
    : p;
};
const phoneDigits = (v: string) =>
  v.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "").slice(0, 10);

/* ---------- the screen ---------- */

type Open = null | "edit" | "logout" | "delete" | "clear" | "bank";

function Profile() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [phone, setPhone] = useState("");
  const [open, setOpen] = useState<Open>(null);
  const [note, setNote] = useState(""); // short confirmation under Change password
  const [s, set] = useSettings();
  const [push, setPush] = usePush(user?.uid);
  const [pushErr, setPushErr] = useState("");
  useEffect(() => (user ? watchCases(user.uid, setCases) : undefined), [user]);
  useEffect(() => {
    if (user)
      getPhone(user.uid)
        .then(setPhone)
        .catch(() => {});
  }, [user]);

  const { recovered, avg, hasDone } = stats(cases);
  const hasPassword = !!user?.providerData.some(
    (p) => p.providerId === "password",
  ); // Google accounts have none
  const close = () => setOpen(null);

  async function changePassword() {
    try {
      await sendPasswordResetEmail(getAuthInstance(), user!.email!);
      setNote(`Link sent to ${user!.email}`);
    } catch {
      setNote("Could not send the link. Try again later.");
    }
  }

  async function clear(which: ClearWhich) {
    close();
    await clearCases(user!.uid, which);
  }
  async function turnOnPush() {
    setPushErr("");
    try {
      setPush(await enablePush(user!.uid, s));
    } catch {
      setPushErr("Could not turn on. Try again.");
    }
  }

  async function logOut() {
    await disablePush(user!.uid); // this phone stops getting this account's alerts
    await signOut(getAuthInstance());
  }

  const notifyRow = (key: keyof Settings, label: string) => (
    <div className="pf-sub">
      <span>{label}</span>
      <Toggle on={!!s[key]} onChange={(v) => set({ [key]: v })} label={label} />
    </div>
  );

  return (
    <div className="tk">
      <header className="pf-top">
        <span className="pf-av">{initials(user?.displayName)}</span>
        <h1>{user?.displayName || "Your profile"}</h1>
        <p>
          {[user?.email, phone && prettyPhone(phone)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <span className={`pf-pill${user?.emailVerified ? "" : " warn"}`}>
          {user?.emailVerified ? "✓ Email verified" : "Verify your email"}
        </span>
      </header>

      <div className="pf-stats">
        <div>
          <b>{cases.length}</b>
          <span>Cases</span>
        </div>
        <div>
          <b>{naira(recovered)}</b>
          <span>Recovered</span>
        </div>
        <div>
          <b>{hasDone ? dur(avg) : "—"}</b>
          <span>Avg wait</span>
        </div>
      </div>

      <div className="pf-tiles">
        <Link href="/history">
          <span>{I.history}</span>History
        </Link>
        <button onClick={() => downloadCsv(cases)} disabled={!cases.length}>
          <span>{I.export}</span>Export
        </button>
        <Link href="/help">
          <span>{I.help}</span>Help
        </Link>
        <Link href="/help#safety">
          <span>{I.shield}</span>Stay safe
        </Link>
      </div>

      <p className="pf-h">ACCOUNT</p>
      <div className="pf-group">
        <Row
          icon={I.user}
          title="Edit details"
          sub="Name and phone number"
          onClick={() => setOpen("edit")}
        />
        {hasPassword && (
          <Row
            icon={I.lock}
            title="Change password"
            sub={note || "We email you a reset link"}
            onClick={changePassword}
          />
        )}
      </div>

      <p className="pf-h">SETTINGS</p>
      <div className="pf-group">
        <div className="pf-block">
          <div className="pf-row plain">
            <span className="pf-ic">{I.sun}</span>
            <span className="pf-txt">
              <b>Appearance</b>
            </span>
          </div>
          <div className="pf-seg" role="radiogroup" aria-label="Appearance">
            {THEMES.map(([v, label]) => (
              <button
                key={v}
                role="radio"
                aria-checked={s.theme === v}
                className={s.theme === v ? "on" : ""}
                onClick={() => set({ theme: v })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="pf-block">
          <Row
            icon={I.bell}
            title="Notifications"
            sub="Alerts on this phone about your cases"
            end={
              <Toggle
                on={s.notify}
                onChange={(v) => set({ notify: v })}
                label="Notifications"
              />
            }
          />
          {s.notify && (
            <>
              <PhoneAlerts state={push} err={pushErr} onTurnOn={turnOnPush} />
              {notifyRow("notifyLate", "When a transfer is late")}
              {notifyRow("notifyDeadline", "Before a refund deadline")}
              {notifyRow("notifyClosed", "When a case closes")}
            </>
          )}
        </div>
        <Row
          icon={I.bank}
          title="Default sending bank"
          sub="Filled in for you when you report"
          onClick={() => setOpen("bank")}
          end={
            <span className="pf-val">
              {s.defaultBank || "None"} <span aria-hidden>›</span>
            </span>
          }
        />
        <Row
          icon={I.eye}
          title="Hide amounts"
          sub="Show ₦••••• on Home until you tap"
          end={
            <Toggle
              on={s.hideAmounts}
              onChange={(v) => set({ hideAmounts: v })}
              label="Hide amounts"
            />
          }
        />
      </div>

      <p className="pf-h">YOUR DATA</p>
      <div className="pf-group">
        <Row
          icon={I.bin}
          title="Clear history"
          sub="Closed cases, or everything"
          onClick={() => setOpen("clear")}
        />
      </div>
      <p className="pf-h">ABOUT</p>
      <div className="pf-group">
        <Row
          icon={I.doc}
          title="Terms of use"
          sub="How the app works"
          href="/terms"
        />
        <Row
          icon={I.privacy}
          title="Privacy policy"
          sub="What we collect and why"
          href="/privacy"
        />
      </div>
      <button className="tk-btn ol pf-out" onClick={() => setOpen("logout")}>
        {I.out} Log out
      </button>
      <button className="pf-delete" onClick={() => setOpen("delete")}>
        Delete account
      </button>
      <p className="pf-ver">TraceNaira 2.0</p>

      {open === "edit" && user && (
        <EditSheet
          name={user.displayName ?? ""}
          phone={phone}
          onClose={close}
          onSave={async (n, p) => {
            await saveProfile(user, n, p);
            setPhone(p);
            close();
          }}
        />
      )}
      {open === "logout" && (
        <Sheet label="Log out" onClose={close}>
          <span className="pf-sheet-ic">{I.out}</span>
          <h2 className="tk-sheet-h">Log out of TraceNaira?</h2>
          <p className="tk-sheet-p">
            Your cases stay saved in your account. Log in again to see them.
          </p>
          <button className="tk-btn" onClick={logOut}>
            Log out
          </button>
          <button className="tk-link" onClick={close}>
            Cancel
          </button>
        </Sheet>
      )}
      {open === "delete" && user && (
        <DeleteSheet count={cases.length} onClose={close} />
      )}
      {open === "clear" && (
        <ClearSheet cases={cases} onPick={clear} onClose={close} />
      )}
      {open === "bank" && (
        <BankPicker
          title="Default sending bank"
          value={s.defaultBank}
          onClose={close}
          onPick={(b) => {
            set({ defaultBank: b });
            close();
          }}
        />
      )}
    </div>
  );
}
// Under Notifications: whether this phone gets alerts when the app is closed
const PUSH_NOTE: Record<PushState, string> = {
  loading: "",
  on: "On",
  off: "",
  denied: "Blocked in settings",
  "ios-install": "Add to Home Screen first",
  unsupported: "Not available in this browser",
};

function PhoneAlerts({
  state,
  err,
  onTurnOn,
}: {
  state: PushState;
  err: string;
  onTurnOn: () => void;
}) {
  if (state === "loading") return null;
  return (
    <div className="pf-sub pf-push">
      <span>
        Phone alerts
        <small>
          {err || "Even when the app is closed. Quiet 10pm to 7am."}
        </small>
      </span>
      {state === "off" ? (
        <button className="pf-on-btn" onClick={onTurnOn}>
          Turn on
        </button>
      ) : (
        <em className={state === "on" ? "on" : ""}>{PUSH_NOTE[state]}</em>
      )}
    </div>
  );
}
function EditSheet({
  name,
  phone,
  onSave,
  onClose,
}: {
  name: string;
  phone: string;
  onSave: (n: string, p: string) => Promise<void>;
  onClose: () => void;
}) {
  const [n, setN] = useState(name);
  const [p, setP] = useState(phone ? phoneDigits(phone) : "");
  const [errs, setErrs] = useState<{
    name?: string;
    phone?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: typeof errs = {};
    if (!n.trim()) found.name = "Enter your full name.";
    if (phoneDigits(p).length !== 10)
      found.phone = "Enter 10 digits, like 803 123 4567.";
    setErrs(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await onSave(n.trim(), `+234${phoneDigits(p)}`);
    } catch {
      setErrs({ form: "Could not save. Check your connection and try again." });
      setBusy(false);
    }
  }

  return (
    <Sheet label="Edit details" onClose={onClose}>
      <div className="sheet-head">
        <h2>Edit details</h2>
        <button
          type="button"
          className="round-btn"
          aria-label="Close"
          onClick={onClose}
        >
          {I.close}
        </button>
      </div>
      <form className="au-form pf-form" onSubmit={submit} noValidate>
        <AuthField
          label="Full name"
          icon="user"
          value={n}
          onChange={(e) => setN(e.target.value)}
          autoComplete="name"
          error={errs.name}
        />
        <AuthField
          label="Phone number"
          icon="phone"
          type="tel"
          prefix="+234"
          inputMode="numeric"
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="803 123 4567"
          autoComplete="tel-national"
          error={errs.phone}
        />
        <button className="tk-btn" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        <ErrorLine>{errs.form}</ErrorLine>
      </form>
    </Sheet>
  );
}

function DeleteSheet({
  count,
  onClose,
}: {
  count: number;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function remove() {
    setErr("");
    // Firebase only lets you delete an account soon after logging in
    const age =
      Date.now() - new Date(user!.metadata.lastSignInTime ?? 0).getTime();
    if (age > 5 * 60 * 1000)
      return setErr(
        "For safety, log out and log in again, then delete your account.",
      );
    setBusy(true);
    try {
      await removeAccount(user!); // you are signed out automatically afterwards
    } catch {
      setErr("Could not delete your account. Try again.");
      setBusy(false);
    }
  }

  return (
    <Sheet label="Delete account" onClose={onClose}>
      <span className="pf-sheet-ic red">{I.bin}</span>
      <h2 className="tk-sheet-h">Delete your account?</h2>
      <p className="tk-sheet-p">
        This permanently deletes your login, your details and{" "}
        {count === 1 ? "your 1 case" : `all ${count} cases`}. It can&apos;t be
        undone.
      </p>
      <button className="tk-btn pf-danger" onClick={remove} disabled={busy}>
        {busy ? "Deleting…" : "Delete my account"}
      </button>
      <ErrorLine>{err}</ErrorLine>
      <button className="tk-link" onClick={onClose}>
        Cancel
      </button>
    </Sheet>
  );
}
