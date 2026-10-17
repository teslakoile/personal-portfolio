#!/usr/bin/env node
/**
 * Does the shipped tab icon animate in a real browser? Opens a page headless, watches the managed
 * <link rel="icon"> swap, then repeats with reduced motion on.
 *
 *   node scripts/kyllm/check-favicon-runtime.mjs [baseUrl]     # default http://localhost:3000
 *
 * Healthy: about 20 swaps a second, gaps from 33 to about 140 ms, exactly one active icon link, no
 * console errors, soft navigation clean, and 0 swaps with reduced motion. A page in a background tab
 * is a separate check: use a real tab and compare against a plain 100 ms timer (throttled to 1000 ms).
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch();

async function run(label, options, ms) {
  const ctx = await browser.newContext(options);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.__swaps = [];
    const t0 = performance.now();
    new MutationObserver(() => {
      if (document.head.querySelector("link[data-kyllm]")) window.__swaps.push(Math.round(performance.now() - t0));
    }).observe(document.head, { childList: true });
  });
  await page.waitForTimeout(ms);
  const swaps = (await page.evaluate(() => window.__swaps)) ?? [];
  const links = await page.evaluate(() => document.head.querySelectorAll('link[rel~="icon"]').length);
  const gaps = swaps.slice(1).map((s, i) => s - swaps[i]).sort((a, b) => a - b);
  console.log(
    `${label}: ${(swaps.length / (ms / 1000)).toFixed(1)} swaps/s, gaps ms ${gaps[0] ?? "-"}/${gaps[gaps.length >> 1] ?? "-"}/${gaps.at(-1) ?? "-"}, ` +
      `active icon links ${links}, errors ${errors.length ? errors.join(" | ") : "none"}`,
  );
  if (label === "default") {
    const link = await page.$('a[href="/projects"]');
    if (link) {
      await link.click();
      await page.waitForTimeout(2500);
      console.log(`  soft navigation to ${new URL(page.url()).pathname}: icon links ${await page.evaluate(() => document.head.querySelectorAll('link[rel~="icon"]').length)}, errors ${errors.length ? errors.join(" | ") : "none"}`);
    }
  }
  await ctx.close();
}

await run("default", {}, 9000);
await run("reduced motion", { reducedMotion: "reduce" }, 5000);
await browser.close();
