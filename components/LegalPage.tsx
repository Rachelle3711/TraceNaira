"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UPDATED, type Block, type LegalDoc } from "@/lib/legal";
import { cameFromApp } from "@/lib/navHistory";

const Back = () => (
  <svg viewBox="0 0 24 24" className="ic" aria-hidden>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

function Body({ b }: { b: Block }) {
  if (typeof b === "string") return <p>{b}</p>;
  if ("li" in b)
    return (
      <ul>
        {b.li.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    );
  return (
    <p>
      <b>{b.b}</b>
      {b.t}
    </p>
  );
}

// Shared layout for /terms and /privacy. Works for guests too, with no bottom bar.
export function LegalPage({
  doc,
  other,
}: {
  doc: LegalDoc;
  other: { href: string; title: string };
}) {
  const router = useRouter();
  function back() {
    // Opened from another screen in the app (Profile, Privacy…): go back to it
    if (cameFromApp()) return router.back();
    // Opened in its own tab from Sign up: close it, so the form is right there
    if (window.history.length <= 1) window.close();
    // Opened straight from a link or the address bar (or the tab wouldn't close): go to the start
    setTimeout(() => router.replace("/"), 150);
  }

  return (
    <div className="tk lg">
      <header className="hs-top lg-top">
        <button className="tk-round" onClick={back} aria-label="Back">
          <Back />
        </button>
        <h1>{doc.title}</h1>
        <p>Last updated {UPDATED}</p>
      </header>
      <p className="lg-intro">{doc.intro}</p>
      <div className="lg-body">
        {doc.sections.map((s, i) => (
          <section key={s.h}>
            <h2>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s.h}
            </h2>
            {s.body.map((b, j) => (
              <Body key={j} b={b} />
            ))}
          </section>
        ))}
      </div>

      <Link className="lg-other" href={other.href}>
        Read our {other.title}
        <span aria-hidden>›</span>
      </Link>
      <p className="lg-foot">TraceNaira · Made in Nigeria</p>
    </div>
  );
}
