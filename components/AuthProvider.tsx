"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { claimGuestCases } from "@/lib/case";

const Ctx = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onAuthStateChanged(getAuthInstance(), (u) => {
        setUser(u);
        setLoading(false);
        // Cases reported before signing in move into the account
        if (u) claimGuestCases(u.uid).catch(() => {});
      }),
    [],
  );
  return <Ctx.Provider value={{ user, loading }}>{children}</Ctx.Provider>;
}
