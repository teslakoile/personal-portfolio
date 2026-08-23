import shell from "../../sections/_shared.module.css";

/**
 * Favicon options, the current mark (A) plus four replacement concepts, each
 * shown at 64/32/16 px and inside a browser-tab mockup. Nothing changes at
 * app/icon.svg (and the .ico/apple-icon derivatives) until a pick lands.
 */

type Concept = { label: string; name: string; note: string; svg: string };

const CURRENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="13" fill="#f5482d"/>
  <g stroke="#faf9f7" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="M22 16v32"/>
    <path d="M42 16 23.5 33.5"/>
    <path d="M25 31.5 43 48"/>
  </g>
</svg>`;

const CONCEPTS: Concept[] = [
  {
    label: "A",
    name: "Current",
    note: "coral tile, stroke K, what ships today",
    svg: CURRENT,
  },
  {
    label: "B",
    name: "Halftone K",
    note: "the K rebuilt from a dot grid with one coral terminal dot, previews the site's new halftone motif; at 16px the dots fuse into a softly textured K",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="13" fill="#1c1917"/>
  <g fill="#faf9f7">
    <circle cx="21" cy="16" r="3.6"/><circle cx="21" cy="24" r="3.6"/>
    <circle cx="21" cy="32" r="3.6"/><circle cx="21" cy="40" r="3.6"/>
    <circle cx="21" cy="48" r="3.6"/><circle cx="29" cy="29" r="3.6"/>
    <circle cx="37" cy="23" r="3.6"/><circle cx="29" cy="35" r="3.6"/>
    <circle cx="37" cy="41" r="3.6"/><circle cx="45" cy="47" r="3.6"/>
  </g>
  <circle cx="45" cy="17" r="3.6" fill="#f5482d"/>
</svg>`,
  },
  {
    label: "C",
    name: "Contribution Tile",
    note: "a 4×4 heatmap of rounded pixels, the coral ramp rising along the diagonal, reads as a glowing grid, instantly distinct from every lettermark in a tab row",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="13" fill="#1c1917"/>
  <g fill="#f5482d">
    <rect x="7.5" y="7.5" width="10" height="10" rx="3" opacity="0.22"/>
    <rect x="20.5" y="7.5" width="10" height="10" rx="3" opacity="0.45"/>
    <rect x="33.5" y="7.5" width="10" height="10" rx="3" opacity="0.22"/>
    <rect x="46.5" y="7.5" width="10" height="10" rx="3"/>
    <rect x="7.5" y="20.5" width="10" height="10" rx="3" opacity="0.45"/>
    <rect x="20.5" y="20.5" width="10" height="10" rx="3" opacity="0.22"/>
    <rect x="33.5" y="20.5" width="10" height="10" rx="3"/>
    <rect x="46.5" y="20.5" width="10" height="10" rx="3" opacity="0.45"/>
    <rect x="7.5" y="33.5" width="10" height="10" rx="3" opacity="0.22"/>
    <rect x="20.5" y="33.5" width="10" height="10" rx="3"/>
    <rect x="33.5" y="33.5" width="10" height="10" rx="3" opacity="0.45"/>
    <rect x="46.5" y="33.5" width="10" height="10" rx="3" opacity="0.22"/>
    <rect x="7.5" y="46.5" width="10" height="10" rx="3"/>
    <rect x="20.5" y="46.5" width="10" height="10" rx="3" opacity="0.45"/>
    <rect x="33.5" y="46.5" width="10" height="10" rx="3" opacity="0.22"/>
    <rect x="46.5" y="46.5" width="10" height="10" rx="3" opacity="0.45"/>
  </g>
</svg>`,
  },
  {
    label: "D",
    name: "Terminal K",
    note: "the stroke K on an ink tile with a coral underscore cursor on its baseline, a paper 'K_' prompt echoing the mono meta layer",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="13" fill="#1c1917"/>
  <g stroke="#faf9f7" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="M19 17v30"/>
    <path d="M38 17 20.5 33.2"/>
    <path d="M21.5 31.8 39 47"/>
  </g>
  <rect x="44" y="40" width="12" height="7" rx="2" fill="#f5482d"/>
</svg>`,
  },
  {
    label: "E",
    name: "Bar and Chevron",
    note: "the K deconstructed into two Swiss primitives, paper stem, coral chevron, the quietest, most poster-like read of the mark",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="13" fill="#1c1917"/>
  <rect x="16" y="15" width="9" height="34" rx="4" fill="#faf9f7"/>
  <path d="M45 17 32 32 45 47" stroke="#f5482d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`,
  },
];

function Mark({ svg, size }: { svg: string; size: number }) {
  return (
    <span
      style={{ display: "inline-block", width: size, height: size, flex: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function TabMockup({ svg }: { svg: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 16px 7px 12px",
        background: "var(--surface)",
        borderRadius: "10px 10px 0 0",
        border: "1px solid var(--border)",
        borderBottom: "none",
        fontSize: "0.8125rem",
        color: "var(--muted)",
        whiteSpace: "nowrap",
      }}
    >
      <Mark svg={svg} size={16} />
      Kyle Naranjo, Data Engineer
      <span style={{ color: "var(--faint)", marginLeft: 10 }}>×</span>
    </span>
  );
}

export default function FaviconRework() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Favicon · pick one</p>
        <h1 className={shell.pageTitle}>Favicon options</h1>
        <p className={shell.pageHint}>
          Each concept at 64 / 32 / 16 px, plus how it reads in a browser tab.
          All draw only from the site palette (ink, paper, coral). The current
          mark stays until you pick, the winner gets rendered into icon.svg,
          favicon.ico, the apple touch icon, and the OG card dot.
        </p>
        <p className={shell.pageHint} style={{ marginTop: 10 }}>
          <strong style={{ color: "var(--fg)", fontWeight: 600 }}>My pick, </strong>
          B carries the halftone motif the hero and dot-matrix options introduce;
          C is the boldest tab presence if you want the graph to be the brand.
        </p>

        {CONCEPTS.map((c) => (
          <div key={c.label} className={shell.vblock}>
            <p className={shell.vlabel}>{c.label} · {c.name}, {c.note}</p>
            <div
              className={shell.vstage}
              style={{
                padding: 28,
                display: "flex",
                alignItems: "flex-end",
                gap: 36,
                flexWrap: "wrap",
              }}
            >
              <Mark svg={c.svg} size={64} />
              <Mark svg={c.svg} size={32} />
              <Mark svg={c.svg} size={16} />
              <span style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
                <TabMockup svg={c.svg} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
