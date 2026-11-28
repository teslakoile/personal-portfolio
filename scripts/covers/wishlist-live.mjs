// The Wishlist cover pieces (r-wishlist, and r-wishlist-n for a narrow tile): one card drawn on the live
// public page (app.wishlist.fit/kyle, signed out), so it uses the app's own
// font, colour tokens, button icon, Kyle's avatar, and his items' own photos.
// The layout is new: the profile row and three items as photo tiles in one
// card. What differs from his list:
//   - three of his nine items are shown, the ones with a clean product photo
//   - names are shortened ("Slash T64 Backpack 18L - Meteorite" to "Slash T64 Backpack",
//     "Freezer cups (gel-filled cooling cups), set of 2" to "Freezer cups, set of 2")
//   - "Sign In to Reserve" reads "Reserve", and one item reads "Reserved"; nothing on his list is reserved
//   - the price sits beside the button; two of the three items have no price on his list
//   - the sweatshirt photo is cropped to the garment, below the model's face
// The narrow piece lists two of the three items as rows, with the count the
// freezer cups come in ("Set of 2") under their name.
//   node scripts/covers/wishlist-live.mjs [out dir, default output/covers]
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const out = process.argv[2] ?? "output/covers";
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 4 });
await p.goto("https://app.wishlist.fit/kyle", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.getByText("Add to Circle").first().waitFor({ timeout: 60000 });
await p.waitForTimeout(6000);

const info = await p.evaluate(async () => {
  const photo = (start) => {
    const a = [...document.querySelectorAll("article")].find((x) => x.querySelector("h2,h3,h4")?.innerText.startsWith(start));
    return a?.querySelector("img")?.currentSrc;
  };
  const items = [
    { name: "Slash T64 Backpack", price: "₱4,590", src: photo("Slash T64"), img: "" },
    { name: "Quarter-zip sweatshirt", src: photo("Quarter-zip"), img: "object-position:50% 58%;transform:scale(1.5);transform-origin:50% 62%;filter:brightness(1.07)" },
    { name: "Freezer cups,<br>set of 2", src: photo("Freezer cups"), img: "", reserved: true },
  ];
  const avatar = document.querySelector("img.avatar-photo").currentSrc;
  const add = [...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "Add to Circle");
  const icon = add.querySelector("svg").outerHTML;
  const count = [...document.querySelectorAll("span,div,p")].map((x) => x.innerText?.trim()).find((t) => /^\d+ items$/.test(t ?? ""));

  const css = `
    #wlr { width: 336px; padding: 14px 15px 15px; background: #fff; font-family: var(--font-sans); color: var(--color-text); -webkit-font-smoothing: antialiased; }
    #wlr * { box-sizing: border-box; margin: 0; }
    #wlr .hd { display: flex; align-items: center; gap: 9px; }
    #wlr .hd > img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
    #wlr .hd b { display: block; color: var(--color-text); font-size: 15.5px; font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; }
    #wlr .hd small { display: block; margin-top: 2px; color: var(--color-muted-green); font-size: 10px; font-weight: 500; line-height: 1.2; }
    #wlr .hd button { display: flex; align-items: center; gap: 5px; height: 26px; margin-left: auto; padding: 0 10px; border: 0; border-radius: 7px; background: var(--color-surface-green); color: var(--color-text); font: 500 10.5px var(--font-sans); }
    #wlr .hd button svg { width: 12px; height: 12px; }
    #wlr .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 13px; }
    #wlr .ph { position: relative; aspect-ratio: 96 / 80; border-radius: 7px; overflow: hidden; background: #f1f3ee; isolation: isolate; }
    #wlr .ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
    #wlr .nm { min-height: 2.5em; margin-top: 7px; color: var(--color-text); font-size: 10.5px; font-weight: 600; line-height: 1.25; letter-spacing: -0.005em; word-spacing: 0.06em; }
    #wlr .act { display: flex; align-items: center; gap: 6px; height: 22px; margin-top: 6px; }
    #wlr .act span { display: flex; align-items: center; gap: 3px; height: 22px; padding: 0 9px; border-radius: 6px; background: var(--color-primary); color: #fff; font-size: 9.5px; font-weight: 600; }
    #wlr .act span.got { padding: 0; background: none; color: var(--color-muted-green); }
    #wlr .act span svg { width: 9px; height: 9px; }
    #wlr .act em { margin-left: auto; color: var(--color-text); font-style: normal; font-size: 10px; font-weight: 600; font-variant-numeric: tabular-nums; }
    #wlrn { width: 240px; margin-top: 40px; padding: 11px 12px 12px; background: #fff; font-family: var(--font-sans); color: var(--color-text); -webkit-font-smoothing: antialiased; }
    #wlrn * { box-sizing: border-box; margin: 0; }
    #wlrn .hd { display: flex; align-items: center; gap: 8px; }
    #wlrn .hd > img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    #wlrn .hd b { display: block; color: var(--color-text); font-size: 14px; font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; }
    #wlrn .hd small { display: block; margin-top: 1px; color: var(--color-muted-green); font-size: 9.5px; font-weight: 500; line-height: 1.2; }
    #wlrn .hd button { display: flex; align-items: center; gap: 4px; height: 24px; margin-left: auto; padding: 0 9px; border: 0; border-radius: 6px; background: var(--color-surface-green); color: var(--color-text); font: 500 10px var(--font-sans); }
    #wlrn .hd button svg { width: 11px; height: 11px; }
    #wlrn .rows { display: grid; gap: 7px; margin-top: 10px; }
    #wlrn .row { display: flex; align-items: center; gap: 8px; }
    #wlrn .ph { position: relative; flex: none; width: 38px; height: 38px; border-radius: 6px; overflow: hidden; background: #f1f3ee; isolation: isolate; }
    #wlrn .ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: multiply; }
    #wlrn .nm { color: var(--color-text); font-size: 10.5px; font-weight: 600; line-height: 1.25; white-space: nowrap; word-spacing: 0.06em; }
    #wlrn .mt { margin-top: 1px; color: var(--color-muted-green); font-size: 9.5px; font-weight: 500; line-height: 1.3; }
    #wlrn .act { display: flex; align-items: center; gap: 3px; height: 21px; margin-left: auto; padding: 0 9px; border-radius: 6px; background: var(--color-primary); color: #fff; font-size: 9.5px; font-weight: 600; }
    #wlrn .act.got { padding: 0; background: none; color: var(--color-muted-green); }
    #wlrn .act svg { width: 9px; height: 9px; }
  `;
  const tick = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2.5 6.4 2.3 2.3 4.7-5.2"/></svg>`;
  document.body.innerHTML = `<style>${css}</style><div id="wlr">
    <div class="hd"><img src="${avatar}" alt=""><div><b>Kyle</b><small>@kyle, ${count}</small></div><button>${icon}Add to Circle</button></div>
    <div class="grid">${items.map((x) => `<div><div class="ph"><img src="${x.src}" style="${x.img}" alt=""></div><p class="nm">${x.name}</p><div class="act">${x.reserved ? `<span class="got">${tick}Reserved</span>` : "<span>Reserve</span>"}${x.price ? `<em>${x.price}</em>` : ""}</div></div>`).join("")}</div>
  </div>
  <div id="wlrn">
    <div class="hd"><img src="${avatar}" alt=""><div><b>Kyle</b><small>@kyle, ${count}</small></div><button>${icon}Add to Circle</button></div>
    <div class="rows">${[{ ...items[0], name: "Slash T64 Backpack", line: items[0].price }, { ...items[2], name: "Freezer cups", line: "Set of 2", zoom: "transform:scale(1.45)" }].map((x) => `<div class="row"><div class="ph"><img src="${x.src}" style="${x.zoom ?? ""}" alt=""></div><div><p class="nm">${x.name}</p><p class="mt">${x.line}</p></div>${x.reserved ? `<span class="act got">${tick}Reserved</span>` : `<span class="act">Reserve</span>`}</div>`).join("")}</div>
  </div>`;
  document.body.style.cssText = "margin:0;padding:30px;background:transparent";
  document.documentElement.style.background = "transparent";
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  const r = document.querySelector("#wlr").getBoundingClientRect();
  const n = document.querySelector("#wlrn").getBoundingClientRect();
  return { items: items.map((x) => [x.name, !!x.src]), avatar: !!avatar, count, size: [Math.round(r.width), Math.round(r.height)], narrow: [Math.round(n.width), Math.round(n.height)], font: getComputedStyle(document.querySelector("#wlr")).fontFamily.slice(0, 40) };
});
console.log(JSON.stringify(info));
await p.waitForTimeout(500);
await p.locator("#wlr").screenshot({ path: `${out}/r-wishlist-4x.png` });
await p.locator("#wlrn").screenshot({ path: `${out}/r-wishlist-n-4x.png` });
console.log(`${out}/r-wishlist-4x.png`, `${out}/r-wishlist-n-4x.png`);
await b.close();
