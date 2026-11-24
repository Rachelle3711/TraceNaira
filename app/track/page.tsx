"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { CaseScreen } from "@/components/CaseScreens";
import { Guard } from "@/components/Guard";
import { watchCases, type Case } from "@/lib/case";
import { EMPTY_ICONS, EmptyState } from "@/components/EmptyState";

// The Track tab opens straight onto your latest open case.
// Once a case is picked it stays on screen, so "Yes, it arrived" shows the result
// instead of jumping to another case.
export default function Track() {
  const { user, loading } = useAuth();
  const owner = user?.uid ?? null;
  const [cases, setCases] = useState<Case[] | null>(null);
  const [id, setId] = useState<string>();
  useEffect(
    () => (loading ? undefined : watchCases(owner, setCases)),
    [loading, owner],
  );

  const picked = cases?.find((c) => c.id === id);
  const latest = cases?.find((c) => c.status !== "resolved");
  useEffect(() => {
    if (!picked && latest) setId(latest.id);
  }, [picked, latest]);

  const c = picked ?? latest;

  return (
    <Guard>
      {!cases ? (
        <div className="tk" />
      ) : c ? (
        <CaseScreen c={c} owner={owner} />
      ) : (
        <div className="tk">
          <header className="hs-top">
            <h1>Track</h1>
            <p>Nothing to track right now</p>
          </header>
          <EmptyState
            icon={EMPTY_ICONS.track}
            title="No open cases"
            text="Nothing is stuck right now. If a payment fails or hangs, report it and we'll follow it here."
          >
            <Link className="tk-btn" href="/report">
              {EMPTY_ICONS.plus} Report a failed transaction
            </Link>
            {cases.length > 0 && (
              <Link className="es-link" href="/history">
                See your history ›
              </Link>
            )}
          </EmptyState>
        </div>
      )}
    </Guard>
  );
}
