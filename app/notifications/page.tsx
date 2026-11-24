"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Guard } from "@/components/Guard";
import { watchCases, type Case } from "@/lib/case";
import { ago, fmtDay } from "@/lib/format";
import {
  buildNotifs,
  markRead,
  useReadIds,
  type Notif,
} from "@/lib/notifications";
import { useSettings } from "@/lib/settings";
import { useNow } from "@/lib/useNow";
import { EMPTY_ICONS, EmptyState } from "@/components/EmptyState";

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    {children}
  </svg>
);
const ICON: Record<Notif["tone"], ReactNode> = {
  red: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </Svg>
  ),
  amber: (
    <Svg>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" />
    </Svg>
  ),
  green: (
    <Svg>
      <path d="m5 12 5 5 9-10" />
    </Svg>
  ),
  info: (
    <Svg>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Svg>
  ),
};
const Back = () => (
  <Svg>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);

const isToday = (ms: number) =>
  new Date(ms).toDateString() === new Date().toDateString();

function Card({ n, read }: { n: Notif; read: boolean }) {
  const router = useRouter();
  return (
    <button
      className={`nt-card${read ? " read" : ""}`}
      onClick={() => {
        markRead(n.id);
        router.push(`/case/${n.caseId}`);
      }}
    >
      <span className={`nt-ic ${n.tone}`}>{ICON[n.tone]}</span>
      <span className="nt-text">
        <b>{n.title}</b>
        <span>{n.body}</span>
        <small>
          {isToday(n.at) ? ago(n.at) : fmtDay(n.at)}
          {read ? " · Read" : ""}
        </small>
      </span>
      {!read && <i className="nt-dot" aria-label="Unread" />}
    </button>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const now = useNow();
  const [settings, set] = useSettings();
  const read = useReadIds();
  const [cases, setCases] = useState<Case[] | null>(null);
  useEffect(() => (user ? watchCases(user.uid, setCases) : undefined), [user]);

  const list = cases ? buildNotifs(cases, now, settings) : [];
  const today = list.filter((n) => isToday(n.at));
  const earlier = list.filter((n) => !isToday(n.at));

  return (
    <Guard>
      <div className="tk">
        <header className="hs-top nt-top">
          <Link className="tk-round" href="/home" aria-label="Back to home">
            <Back />
          </Link>
          <h1>Notifications</h1>
        </header>

        {cases && !settings.notify && (
          <EmptyState
            icon={EMPTY_ICONS.bellOff}
            tone="grey"
            title="Notifications are off"
            text="Turn them on to hear when a transfer is late or a refund deadline is close."
          >
            <button className="tk-btn" onClick={() => set({ notify: true })}>
              Turn on notifications
            </button>
            <Link className="es-link" href="/profile">
              Choose which ones in Profile ›
            </Link>
          </EmptyState>
        )}
        {cases && settings.notify && list.length === 0 && (
          <EmptyState
            icon={EMPTY_ICONS.bellOk}
            title="You're all caught up"
            text="We'll tell you here when a transfer is late or a refund deadline is close."
          />
        )}

        {today.length > 0 && <p className="nt-sec">TODAY</p>}
        {today.map((n) => (
          <Card key={n.id} n={n} read={read.has(n.id)} />
        ))}
        {earlier.length > 0 && <p className="nt-sec">EARLIER</p>}
        {earlier.map((n) => (
          <Card key={n.id} n={n} read={read.has(n.id)} />
        ))}
      </div>
    </Guard>
  );
}
