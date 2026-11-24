"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { withNext } from "@/lib/next";

const icons = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  report: <path d="M12 5v14M5 12h14" />,
  track: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  login: (
    <>
      <path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m9 16 4-4-4-4M13 12H3" />
    </>
  ),
};

// White bottom bar (design B): five tabs, round Report button in the middle,
// a small green dot under the tab you are on.
export function NavBar() {
  const path = usePathname();
  const { user } = useAuth();
  const TABS: { href: string; label: string; icon: keyof typeof icons }[] = [
    // Guests have no Home dashboard yet, so Home goes to the welcome screen
    { href: user ? "/home" : "/", label: "Home", icon: "home" },
    { href: "/report", label: "Report", icon: "report" },
    { href: "/track", label: "Track", icon: "track" },
    { href: "/history", label: "History", icon: "history" },
    // Guests don't have a profile: the last tab is Log in, and brings them back here afterwards
    user
      ? { href: "/profile", label: "Profile", icon: "profile" }
      : { href: withNext("/login", path), label: "Log in", icon: "login" },
  ];
  // Case screens belong to the Track tab; Help, Settings and Edit profile belong to Profile
  const isOn = (h: string) =>
    h === "/track"
      ? path.startsWith("/track") || path.startsWith("/case/")
      : h === "/profile"
        ? path.startsWith("/profile") || path.startsWith("/help") || path.startsWith("/settings")
        : path === h;

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const on = isOn(t.href);
        const icon = (
          <svg viewBox="0 0 24 24" className="ic" aria-hidden>
            {icons[t.icon]}
          </svg>
        );
        return t.icon === "report" ? (
          <Link key={t.label} href={t.href} className={`tab rpt${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
            <span className="rpt-btn">{icon}</span>
            {t.label}
          </Link>
        ) : (
          <Link key={t.label} href={t.href} className={`tab${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
            {icon}
            {t.label}
            <i className="tab-dot" />
          </Link>
        );
      })}
    </nav>
  );
}