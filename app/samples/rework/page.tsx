import Link from "next/link";
import shell from "../sections/_shared.module.css";

/**
 * Rework index, per-section design options for the landing page. Each page
 * renders the REAL components (the current landing design labeled A, plus
 * alternatives), so what you pick is exactly what ships.
 */
// Fontset decision: Swiss (Geist + Geist Mono), locked in app/fonts.ts, the
// comparison page is retired and the whole app renders the global set.
const PAGES = [
  { href: "/samples/rework/before-after", title: "Before / after, font trim + label sweep", note: "payload 434 KB → 52 KB · eyebrow removed · all-caps labels de-capped" },
  { href: "/samples/rework/certifications", title: "Certifications", note: "4 options, badge cards · registry table · issuer groups · badge wall" },
  { href: "/samples/rework/writing", title: "Writing", note: "4 options, horizontal cards · editorial spreads · stacked feature · two-up" },
  { href: "/samples/rework/community", title: "Community & Speaking", note: "2 options, org cards · stat billboard" },
  { href: "/samples/rework/recognition", title: "Recognition", note: "4 options, inline list · ink-rule columns · cards · accent cards" },
  { href: "/samples/rework/projects", title: "Projects", note: "baseline (tab-hover preview) + 3 optional add-ons, drag to deal · spread the files · riffle" },
  { href: "/samples/rework/recommendations", title: "Recommendations", note: "6 options, quote cards · pull quotes · ledger · blurbs · speech bubbles · avatar thread" },
  { href: "/samples/rework/resources", title: "Resources", note: "6 options, cards · bibliography · contents · split · cover shelf · icon plates" },
  { href: "/samples/rework/github", title: "GitHub", note: "6 options, card · ink band · ledger · plate · dot matrix · year strip" },
  { href: "/samples/rework/favicon", title: "Favicon", note: "5 options, current · halftone K · contribution tile · terminal K · bar and chevron" },
];

export default function ReworkIndex() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Section rework · pick per section</p>
        <h1 className={shell.pageTitle}>Design options, section by section</h1>
        <p className={shell.pageHint}>
          Option A on every page is what the landing page shows today. Every
          option renders on the locked typography baseline (Swiss fontset,
          no eyebrows or all-caps, Title Case labels, see app/fonts.ts), so
          comparisons are apples to apples. Nothing changes on the home page
          until you name your picks.
        </p>
        <div style={{ display: "grid", gap: 10, marginTop: 32 }}>
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`${shell.card} ${shell.cardHover}`}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <span style={{ fontWeight: 600 }}>{p.title}</span>
              <span className={shell.muted} style={{ display: "block", fontSize: "0.875rem", marginTop: 4 }}>
                {p.note}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
