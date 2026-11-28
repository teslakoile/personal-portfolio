#!/usr/bin/env node
// Captures every cover piece in scripts/covers/pieces.html (each top-level
// element with data-piece) at 4x on a transparent page, as <name>-4x.png, and
// prints each piece's CSS size. A piece should be about 213px tall: see
// .claude/skills/project-cover/SKILL.md.
//   node scripts/covers/capture.mjs [out dir, default output/covers] [--only r-zervo]
import { mkdirSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const at = args.indexOf("--only");
const only = at >= 0 ? args.splice(at, 2)[1] : null;
const out = args[0] ?? "output/covers";
mkdirSync(out, { recursive: true });

const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 700, height: 2400 }, deviceScaleFactor: 4 });
await p.goto(pathToFileURL(path.join(here, "pieces.html")).href);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
const names = await p.evaluate(() => [...document.querySelectorAll("[data-piece]")].map((x) => x.dataset.piece));
for (const name of names) {
  if (only && name !== only) continue;
  const el = p.locator(`[data-piece="${name}"]`);
  const box = await el.boundingBox();
  await el.screenshot({ path: `${out}/${name}-4x.png`, omitBackground: true });
  console.log(`${name}  ${Math.round(box.width)} x ${Math.round(box.height)} CSS px`);
}
await b.close();
