// Renders KYLLM's motion to frames for places that can't run the inline rig
// (a README, an email, a social card). Run rig.py first, then:
//
//   node scripts/kyllm/motion.mjs
//   uv run --with pillow python scripts/kyllm/motion.py
//
// Loads public/kyllm/kyllm-avatar-rig.svg in headless Chromium, pauses its
// CSS animations, and steps their clocks frame by frame, so every frame is
// exact rather than a screen recording. Writes PNG frames to
// scripts/kyllm/build/motion/<clip>/. Loops (idle, think, read) cover one
// 4.8s cycle, which every loop in the rig shares, so they repeat seamlessly.
// Enter clips (answered, curious, sorry) start from idle and run 1s into
// the state. Each state also gets one still frame.
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const HERE = new URL(".", import.meta.url).pathname;
const OUT = join(HERE, "build/motion");
const SIZE = 192; // 2x a 96px avatar
const LOOPS = ["idle", "think", "read"];
const ENTERS = ["answered", "curious", "sorry"];
const CYCLE = 4800;

const svg = await readFile(join(HERE, "../../public/kyllm/kyllm-avatar-rig.svg"), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
await page.setContent(
  `<style>html,body{margin:0;background:transparent}svg{width:${SIZE}px;height:${SIZE}px;display:block}</style>${svg}`,
);
const el = page.locator("svg");

const setState = (s) => page.evaluate((s) => document.querySelector("svg").setAttribute("data-state", s), s);
const pauseAt = (t) =>
  page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
const settle = () => page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.finished)));

async function shot(dir, i) {
  await el.screenshot({ path: join(dir, `${String(i).padStart(3, "0")}.png`), omitBackground: true });
}

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, "still"), { recursive: true });

for (const s of LOOPS) {
  const dir = join(OUT, s);
  await mkdir(dir, { recursive: true });
  await setState(s);
  await settle();
  const fps = 20;
  // One cycle after every delay has passed, so the frames are the steady loop.
  for (let i = 0; i < (CYCLE / 1000) * fps; i++) {
    await pauseAt(CYCLE + (i * 1000) / fps);
    await shot(dir, i);
  }
  await pauseAt(CYCLE);
  await el.screenshot({ path: join(OUT, "still", `${s}.png`), omitBackground: true });
}

for (const s of ENTERS) {
  const dir = join(OUT, s);
  await mkdir(dir, { recursive: true });
  await setState("idle");
  await settle();
  await pauseAt(CYCLE); // eyes open, leaf at rest
  await setState(s);
  const fps = 30;
  for (let i = 0; i <= fps; i++) {
    await pauseAt((i * 1000) / fps);
    await shot(dir, i);
  }
  await el.screenshot({ path: join(OUT, "still", `${s}.png`), omitBackground: true });
}

await browser.close();
console.log(`wrote frames for ${[...LOOPS, ...ENTERS].join(", ")} to ${OUT}`);
