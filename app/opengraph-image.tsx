import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Kyle Naranjo, Data Engineer II. I build AI agents, data pipelines, and cloud infrastructure.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors the hero headline, "AI agents" in coral.
const HEADLINE: [string, boolean][] = [
  ["I", false], ["build", false], ["AI", true], ["agents,", true], ["data", false],
  ["pipelines,", false], ["and", false], ["cloud", false], ["infrastructure.", false],
];

/** Geist TTF via the Google Fonts CSS API (an old UA gets truetype URLs).
    Fails soft, satori falls back to its default sans if the fetch dies. */
async function loadGeist(weight: 500 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}&display=swap`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" },
      })
    ).text();
    const url = css.match(/src:\s*url\((https:[^)]+)\)\s*format\(['"](?:truetype|opentype)['"]\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const [medium, bold, photo] = await Promise.all([
    loadGeist(500),
    loadGeist(700),
    // Same card photo as the hero: true-colour Kyle over the two-tone coral dither.
    readFile(join(process.cwd(), "app/_og/kyle-card.png"), "base64"),
  ]);
  const fonts: NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"] = [];
  if (medium) fonts.push({ name: "Geist", data: medium, weight: 500, style: "normal" });
  if (bold) fonts.push({ name: "Geist", data: bold, weight: 700, style: "normal" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf9f7",
          fontFamily: fonts.length ? "Geist" : "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "68px 64px 64px 76px",
            backgroundImage:
              "linear-gradient(to right, #eceae4 1px, transparent 1px), linear-gradient(to bottom, #eceae4 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          {/* site principle: no eyebrows, no all-caps, a lone coral dot marks the top */}
          <div style={{ width: 16, height: 16, background: "#f5482d", borderRadius: 4 }} />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: -1.6,
              color: "#1c1917",
            }}
          >
            {/* one span per word, so satori can wrap the mixed-colour line */}
            {HEADLINE.map(([word, coral], i) => (
              <span key={i} style={{ color: coral ? "#f5482d" : "#1c1917", marginRight: 13 }}>
                {word}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#1c1917" }}>Kyle Naranjo</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#57534e" }}>
              Data Engineer II · Thinking Machines Data Science
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#f5482d", marginTop: 6 }}>kylenaranjo.cv</div>
          </div>
        </div>
        <img src={`data:image/png;base64,${photo}`} width={541} height={630} alt="" style={{ objectFit: "cover" }} />
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
