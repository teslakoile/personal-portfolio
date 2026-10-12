#!/usr/bin/env node
/**
 * Renders SVG files to transparent PNGs with headless Chromium.
 *
 *   node scripts/kyllm/render_svgs.mjs <in-dir> <out-dir> [size]
 *
 * Every *.svg in <in-dir> becomes <out-dir>/<name>.png at size x size
 * (default 1024). Used by favicon_anim_options.py, which composes frames as
 * SVG so transforms (rotate, squash, glasses shift) stay vector-exact.
 */
import { readdir, readFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { chromium } from "playwright";

const [inDir, outDir, sizeArg] = process.argv.slice(2);
const size = Number(sizeArg || 1024);
await mkdir(outDir, { recursive: true });
const files = (await readdir(inDir)).filter((f) => f.endsWith(".svg"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: size, height: size } });
for (const f of files) {
  const svg = await readFile(join(inDir, f), "utf8");
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace(
      "<svg ",
      `<svg width="${size}" height="${size}" style="display:block" `,
    )}</body></html>`,
  );
  await page.screenshot({ path: join(outDir, basename(f, ".svg") + ".png"), omitBackground: true });
}
await browser.close();
console.log(`rendered ${files.length} frames`);
