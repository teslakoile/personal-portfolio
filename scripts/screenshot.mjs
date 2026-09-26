#!/usr/bin/env node
/**
 * Headless screenshots of the running site, for checking a change visually
 * without a browser window (cloud sessions, CI, review agents).
 *
 *   npm run shot                              # "/" at desktop and mobile
 *   npm run shot -- /projects --viewport mobile
 *   npm run shot -- / --tiles                 # the whole page, one PNG per screen
 *   npm run shot -- / --full                  # the whole page as one tall PNG
 *
 * Options:
 *   --viewport desktop|tablet|mobile|WxH   repeatable, default desktop + mobile
 *   --tiles        capture every screen of the page as NN.png, top to bottom
 *   --full         one full-page PNG (a tall page downscales badly when read
 *                  back as an image, so prefer --tiles for review)
 *   --selector S   capture only the first element matching S
 *   --reduced-motion   emulate prefers-reduced-motion: reduce
 *   --base URL     default http://localhost:3000, or $SCREENSHOT_BASE_URL
 *   --out DIR      default output/screenshots (gitignored)
 *
 * If nothing answers at --base, the script starts `npm run dev` on that port,
 * waits for it, and stops it afterwards. Start the dev server yourself when
 * you take many screenshots, so each run skips the compile.
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

function parseArgs(argv) {
  const opts = {
    routes: [],
    viewports: [],
    tiles: false,
    full: false,
    selector: null,
    reducedMotion: false,
    base: process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000",
    out: "output/screenshots",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--viewport") opts.viewports.push(argv[++i]);
    else if (arg === "--tiles") opts.tiles = true;
    else if (arg === "--full") opts.full = true;
    else if (arg === "--selector") opts.selector = argv[++i];
    else if (arg === "--reduced-motion") opts.reducedMotion = true;
    else if (arg === "--base") opts.base = argv[++i];
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}`);
    else opts.routes.push(arg);
  }
  if (opts.routes.length === 0) opts.routes.push("/");
  if (opts.viewports.length === 0) opts.viewports.push("desktop", "mobile");
  return opts;
}

function resolveViewport(name) {
  if (VIEWPORTS[name]) return { name, ...VIEWPORTS[name] };
  const match = /^(\d+)x(\d+)$/.exec(name);
  if (!match) throw new Error(`Viewport "${name}" is not a preset or WxH`);
  return { name, width: Number(match[1]), height: Number(match[2]) };
}

async function isUp(base) {
  try {
    const res = await fetch(base, { signal: AbortSignal.timeout(3000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function ensureServer(base) {
  if (await isUp(base)) return null;
  const port = new URL(base).port || "3000";
  console.log(`No server at ${base}, starting \`npm run dev\` on port ${port}...`);
  const child = spawn("npm", ["run", "dev", "--", "-p", port], {
    stdio: ["ignore", "ignore", "inherit"],
    detached: true,
  });
  for (let waited = 0; waited < 180; waited += 2) {
    if (await isUp(base)) return child;
    if (child.exitCode !== null) throw new Error("`npm run dev` exited early");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Dev server did not answer at ${base} within 180s`);
}

function slug(route) {
  const s = route.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9]+/g, "-");
  return s || "home";
}

// The site sets `scroll-behavior: smooth`, which turns every scripted scroll
// into an animation that a screenshot would catch halfway. Next's dev badge
// is hidden too, since it is not part of the page.
const CAPTURE_CSS = `
  html, body { scroll-behavior: auto !important; }
  nextjs-portal { display: none !important; }
`;

async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
}

// Walks the page once so IntersectionObserver reveals and lazy images fire
// before anything is captured, then returns to the top.
async function settle(page) {
  await page.addStyleTag({ content: CAPTURE_CSS });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await scrollTo(page, 0);
  await page.waitForTimeout(600);
}

async function capture(browser, opts, route, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: opts.reducedMotion ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

  const url = new URL(route, opts.base).toString();
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  await settle(page);

  const dir = join(opts.out, slug(route), viewport.name);
  await mkdir(dir, { recursive: true });
  const files = [];

  if (opts.selector) {
    const file = join(dir, "element.png");
    await page.locator(opts.selector).first().screenshot({ path: file });
    files.push(file);
  } else if (opts.tiles) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const count = Math.ceil(height / viewport.height);
    for (let i = 0; i < count; i++) {
      await scrollTo(page, i * viewport.height);
      await page.waitForTimeout(450);
      const file = join(dir, `${String(i + 1).padStart(2, "0")}.png`);
      await page.screenshot({ path: file });
      files.push(file);
    }
  } else {
    const file = join(dir, opts.full ? "full.png" : "top.png");
    await page.screenshot({ path: file, fullPage: opts.full });
    files.push(file);
  }

  await context.close();
  return { url, status: res?.status(), files, errors };
}

const opts = parseArgs(process.argv.slice(2));
const server = await ensureServer(opts.base);
const browser = await chromium.launch();
let failed = false;
try {
  for (const route of opts.routes) {
    for (const name of opts.viewports) {
      const viewport = resolveViewport(name);
      const result = await capture(browser, opts, route, viewport);
      console.log(`${result.url} @ ${viewport.name} ${viewport.width}x${viewport.height} -> HTTP ${result.status}`);
      for (const file of result.files) console.log(`  ${file}`);
      for (const err of result.errors) console.log(`  console error: ${err}`);
      if (!result.status || result.status >= 400) failed = true;
    }
  }
} finally {
  await browser.close();
  if (server) process.kill(-server.pid, "SIGTERM");
}
process.exit(failed ? 1 : 0);
