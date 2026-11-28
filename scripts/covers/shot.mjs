#!/usr/bin/env node
// Renders every project cover tile at 2x, prints each piece's margins as
// shares of its tile, and lays the tiles on one sheet to look at or send.
// Needs the dev server running.
//   node scripts/covers/shot.mjs [--base http://localhost:3000] [--width 1440] [--on covers,wide] [--out output/covers/tiles]
// With no --on it renders the landing page, which shows the covers three
// across. --on renders /samples/polished/options with that option list:
// "covers,wide" is two across, and adding "fallback" shows the earlier set.
// A 390 --width gives the phone layout.
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const base = arg("base", process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000");
const on = arg("on", null);
const width = Number(arg("width", 1440));
const out = arg("out", "output/covers/tiles");
mkdirSync(out, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 2, isMobile: width < 500, hasTouch: width < 500 });
await p.goto(on ? `${base}/samples/polished/options?on=${on}` : `${base}/`, { waitUntil: "networkidle" });
await p.addStyleTag({ content: "html{scroll-behavior:auto!important} nextjs-portal{display:none!important} button[class*=dockPill]{display:none!important} nav[aria-label='Visual options']{display:none!important}" });
await p.waitForTimeout(1200);

const cards = await p.$$("#projects article");
const files = [];
for (let i = 0; i < cards.length; i++) {
  const tile = await cards[i].$("[role=img]");
  if (!tile) continue;
  const slug = (await cards[i].$eval("h3", (h) => h.innerText)).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await tile.scrollIntoViewIfNeeded();
  await p.waitForTimeout(250);
  const file = `${out}/tile-${i + 1}-${slug}.png`;
  await tile.screenshot({ path: file });
  files.push(file);
  const m = await tile.evaluate((t) => {
    const r = t.getBoundingClientRect();
    const s = t.firstElementChild.getBoundingClientRect();
    const pct = (x) => `${Math.round(x * 100)}%`;
    return `tile ${Math.round(r.width)}x${Math.round(r.height)}  piece ${Math.round(s.width)}x${Math.round(s.height)}  side ${pct((s.left - r.left) / r.width)}  top ${pct((s.top - r.top) / r.height)}  bottom ${pct((r.bottom - s.bottom) / r.height)}`;
  });
  console.log(`${slug.padEnd(18)} ${m}`);
}
await b.close();

const sheet = `${out}/sheet.png`;
execFileSync("python3", ["-c", `
import sys
from PIL import Image
ims = [Image.open(f) for f in sys.argv[2:]]
w, h, g = max(i.width for i in ims), max(i.height for i in ims), 24
rows = -(-len(ims) // 3)
s = Image.new("RGB", (3 * w + 4 * g, rows * h + (rows + 1) * g), "#f6f4ef")
for i, im in enumerate(ims): s.paste(im, (g + (i % 3) * (w + g), g + (i // 3) * (h + g)))
s.save(sys.argv[1])
`, sheet, ...files]);
console.log(sheet);
