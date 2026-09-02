import Link from "next/link";
import shell from "./_shared.module.css";

const sections = [
  { key: "hero", name: "Hero", pick: "V4 · photo (your pick)", blurb: "Headline + framed photo (placeholder). V1/V2/V3 still viewable." },
  { key: "about", name: "About", pick: "V3 · at a glance (refined)", blurb: "Lead + supporting line, with a labeled fact card. Paragraph spacing fixed." },
  { key: "experience", name: "Experience", pick: "V1 · timeline (your pick)", blurb: "Date rail on the left, reads as a timeline." },
  { key: "skills", name: "Skills", pick: "V3 · descriptor cards (refined)", blurb: "Four groups now, each with a capability line. Added Backend & APIs." },
  { key: "writing", name: "Writing", pick: "V1 · horizontal (your pick)", blurb: "Now with reading time + tag chips. Let's talk more post elements." },
  { key: "recognition", name: "Recognition", pick: "V2 · inline list (your pick)", blurb: "Sleek dashed-rule list, no boxes." },
  { key: "community", name: "Community & Speaking", pick: "3 explorations · pick one", blurb: "A=editorial spread, B=blueprint timeline, C=impact ledger. Both orgs + all four talks in each." },
  { key: "education", name: "Education", pick: "3 explorations · pick one", blurb: "A=sealed diploma cards, B=academic timeline rail, C=transcript registry with honour chips." },
  { key: "community/refined", name: "Community & Speaking, refined", pick: "round 2 · from C (impact ledger)", blurb: "Shapers now reads as part of one family; type experiments (V1 Geist · V2 Fraunces serif · V3 quiet)." },
  { key: "education/refined", name: "Education, refined", pick: "round 2 · from A (diploma cards)", blurb: "Real UP/PSHS logos, coral removed, restyled Honours; V1 Geist · V2 Fraunces diploma · V3 registry." },
  { key: "community/final", name: "Community & Speaking, converged", pick: "round 3 · the pick, dialed in", blurb: "V1 base: labels removed, both cards white, GDG logo added (Shapers = wordmark), KPI + numbered talks kept." },
  { key: "education/final", name: "Education, card-less", pick: "round 3 · 2 card-less takes", blurb: "No card containers, content on paper w/ hairlines. A=Ledger (Geist), B=Registry (Fraunces, numbered)." },
  { key: "stack", name: "Tech Stack Band", pick: "V1 · Quiet Line (your pick)", blurb: "One slow ruled row, bare logos. Alternatives kept: Hairline Grid, Grouped Rails, Paged Rail, and the old two-row marquee." },
];

export default function SectionsIndex() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Section variations · your picks</p>
        <h1 className={shell.pageTitle}>Choose a layout for each section</h1>
        <p className={shell.pageHint}>
          Your picks are locked in below and assembled into one page. Open any section to revisit the alternatives,
          or see everything composed together first.
        </p>

        <Link href="/samples/home" className={`${shell.card} ${shell.cardHover}`} style={{ display: "block", textDecoration: "none", color: "inherit", marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
            <span className={shell.h3}>▶ See your picks composed →</span>
            <span className={shell.faint} style={{ fontSize: "0.8125rem" }}>/samples/home</span>
          </div>
          <p className={shell.muted} style={{ margin: "6px 0 0", fontSize: "0.9375rem" }}>
            The full home page with every choice in place, photo hero, refined about, timeline, four skill groups, tagged writing.
          </p>
        </Link>

        <ul style={{ listStyle: "none", padding: 0, margin: "36px 0 0", display: "grid", gap: 12 }}>
          {sections.map((s) => (
            <li key={s.key}>
              <Link href={`/samples/sections/${s.key}`} className={`${shell.card} ${shell.cardHover}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                  <span className={shell.h3}>{s.name}</span>
                  <span className={shell.faint} style={{ fontSize: "0.8125rem" }}>my pick: {s.pick} →</span>
                </div>
                <p className={shell.muted} style={{ margin: "6px 0 0", fontSize: "0.9375rem" }}>{s.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>

        <p className={shell.pageHint} style={{ marginTop: 40 }}>
          Certifications isn&rsquo;t here, you already chose the clickable badge grid (V3). It stays as-is.
        </p>
      </div>
    </div>
  );
}
