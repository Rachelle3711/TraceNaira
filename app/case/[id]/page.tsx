"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CaseScreen } from "@/components/CaseScreens";
import { Guard } from "@/components/Guard";
import { claimGuestCases, watchCase, type Case } from "@/lib/case";
import { isGuestId, readClaimMap } from "@/lib/guest";

export default function CasePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [c, setC] = useState<Case | null | undefined>(undefined); // undefined = loading, null = not found
  const owner = user?.uid ?? null;
  // A guest case opened after logging in has moved to the account under a new id
  const guestAfterLogin = !!user && isGuestId(id);

  useEffect(() => {
    if (loading) return;
    if (guestAfterLogin) {
      const go = (map: Record<string, string>) => {
        if (map[id]) router.replace(`/case/${map[id]}`);
        else setC(null);
      };
      const known = readClaimMap()[id];
      if (known) router.replace(`/case/${known}`);
      else claimGuestCases(user!.uid).then(go).catch(() => setC(null));
      return;
    }
    return watchCase(owner, id, setC);
  }, [loading, owner, id, guestAfterLogin, user, router]);

  return (
    <Guard guest>
      {c ? (
        <CaseScreen c={c} owner={owner} />
      ) : (
        <div className="tk">
          <header className="hs-top">
            <h1>Your case</h1>
            <p>{c === null ? "This case isn't on this phone or account." : "Loading…"}</p>
          </header>
        </div>
      )}
    </Guard>
  );
}