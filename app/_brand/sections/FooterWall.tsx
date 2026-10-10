"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import f from "./footer.module.css";

/**
 * The footer's photo wall, drawn with WebGL when the device has a mouse and
 * the wall is in its desktop grid. One canvas sits over the grid and draws
 * every tile: the halftone (the mask tinted in the tile's ink on paper) that
 * swells like a lens under the mouse, and on click the original photo,
 * opening in a circle from the click point with a light spring. A second
 * click closes it toward that click.
 *
 * The DOM tiles underneath keep the layout and take the clicks; on phones,
 * touch screens, or without WebGL they are the footer, with the same click
 * reveal in CSS (FooterTile). The halftone masks are mipmapped so their fine
 * dots average out instead of beating into moire, and the loop only runs
 * while something moves and the wall is on screen.
 */
export type WallTile = { n: number; ink: string };

const INK: Record<string, [number, number, number]> = {
  "var(--b1)": [0xf2, 0x6a, 0x4b], "var(--b2)": [0x7f, 0xb9, 0x9a], "var(--b3)": [0x86, 0xa9, 0xc8], "var(--b4)": [0xe9, 0xb6, 0x5c],
};
const PAPER: [number, number, number] = [0xfa, 0xf9, 0xf7];
/** click reveal length, ms */
const REVEAL_MS = 800;
/** a light spring: about 15% past the end, settled by the end */
const spring = (x: number) => (x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(11 * x));
/** the click pulse: dip, swell past rest, settle */
const pulseAt = (x: number) => {
  const k: [number, number][] = [[0, 1], [0.3, 0.96], [0.65, 1.015], [1, 1]];
  for (let i = 1; i < k.length; i++) if (x <= k[i][0]) {
    const s = (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0]), e = s * s * (3 - 2 * s);
    return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * e;
  }
  return 1;
};
/** fast toward a higher value, slow back down (seconds to ~63%) */
const ease = (v: number, to: number, dt: number, up: number, down: number) => v + (to - v) * (1 - Math.exp(-dt / (to > v ? up : down)));

const VERT = `
attribute vec2 a;
uniform vec4 uRect;      // x, y, w, h in canvas pixels, y from the top
uniform vec2 uView;      // canvas size, pixels
uniform float uScale;    // click pulse, around the tile's centre
varying vec2 vUv;
void main() {
  vec2 c = uRect.xy + uRect.zw * 0.5;
  vec2 p = c + (uRect.xy + a * uRect.zw - c) * uScale;
  gl_Position = vec4(p / uView * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
  vUv = a;
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uPhoto, uMask;
uniform vec3 uInk, uPaper;
uniform vec2 uCoverP, uCoverM;  // object-fit: cover, as uv scales
uniform vec2 uMouse, uClick;    // tile uv; the mouse can be outside 0..1
uniform float uAspect, uBulge, uReveal;
varying vec2 vUv;
void main() {
  // bulge: pull the picture toward the mouse, strongest at its centre
  vec2 uv = vUv;
  vec2 d = (uv - uMouse) * vec2(uAspect, 1.0);
  uv -= d / vec2(uAspect, 1.0) * exp(-dot(d, d) * 9.0) * 0.32 * uBulge;
  // iris: a circle of photo from the click point; 1.45 reaches any corner
  float rad = uReveal * 1.45;
  float k = 1.0 - smoothstep(rad - 0.035, rad, length((uv - uClick) * vec2(uAspect, 1.0)));
  vec3 photo = texture2D(uPhoto, (uv - 0.5) * uCoverP + 0.5).rgb;
  float m = texture2D(uMask, (uv - 0.5) * uCoverM + 0.5).a;
  gl_FragColor = vec4(mix(mix(uPaper, uInk, m), photo, clamp(k, 0.0, 1.0)), 1.0);
}`;

export function FooterWall({ tiles, children }: { tiles: WallTile[]; children: ReactNode }) {
  const wall = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const kept = useRef<Set<number>>(new Set());
  const tweens = useRef<Map<number, { from: number; to: number; start: number }>>(new Map());
  const clicks = useRef<Map<number, [number, number]>>(new Map());
  const pulses = useRef<Map<number, number>>(new Map());
  const reveal = useRef<number[]>([]);
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    const w = wall.current, cv = canvas.current;
    // the drawn wall is for a mouse on the desktop grid; elsewhere the DOM tiles stand
    if (!w || !cv || !matchMedia("(pointer: fine) and (min-width: 761px)").matches) return;
    const gl = cv.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) return;

    const shader = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      rect: u("uRect"), view: u("uView"), scale: u("uScale"), photo: u("uPhoto"), mask: u("uMask"), ink: u("uInk"), paper: u("uPaper"),
      coverP: u("uCoverP"), coverM: u("uCoverM"), mouse: u("uMouse"), click: u("uClick"), aspect: u("uAspect"), bulge: u("uBulge"), reveal: u("uReveal"),
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(U.photo, 0); gl.uniform1i(U.mask, 1);
    gl.uniform3f(U.paper, PAPER[0] / 255, PAPER[1] / 255, PAPER[2] / 255);

    // textures: 12 photos, and 12 masks resized to a power of two so they mipmap
    const tex = new Map<string, WebGLTexture>();
    const aspectOf = new Map<string, number>();
    const pot = (img: HTMLImageElement) => {
      const side = (n: number) => 2 ** Math.round(Math.log2(n));
      const c = document.createElement("canvas");
      c.width = side(img.naturalWidth); c.height = side(img.naturalHeight);
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c;
    };
    const load = (key: string, src: string, mask: boolean) => new Promise<void>((done) => {
      const img = new Image();
      img.onload = () => {
        const t = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, t);
        aspectOf.set(key, img.naturalWidth / img.naturalHeight);
        if (mask) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pot(img));
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        tex.set(key, t);
        done();
      };
      img.onerror = () => done();
      img.src = src;
    });

    const els = Array.from(w.querySelectorAll<HTMLElement>("[data-tile]"));
    const R = els.map(() => 0), B = els.map(() => 0);
    reveal.current = R;
    let mx = -9999, my = -9999, raf = 0, last = 0, alive = true, visible = true, loaded = false;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const size = () => {
      const b = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
      cv.width = Math.round(b.width * dpr); cv.height = Math.round(b.height * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(U.view, cv.width, cv.height);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !loaded) return;
      const t = performance.now();
      const dt = Math.min((now - (last || now)) / 1000, 1 / 20);
      last = now;
      const cb = cv.getBoundingClientRect(), dpr = cv.width / cb.width;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      let busy = false;
      els.forEach((el, i) => {
        const b = el.getBoundingClientRect();
        // the reveal: a spring tween from where the tile was to where it is going
        const tw = tweens.current.get(i);
        if (tw) {
          const x = still ? 1 : Math.min(1, (t - tw.start) / REVEAL_MS);
          R[i] = tw.from + (tw.to - tw.from) * spring(x);
          if (x >= 1) { R[i] = tw.to; tweens.current.delete(i); } else busy = true;
        }
        // the bulge: strongest on the tile under the mouse, a little on its neighbours
        const dist = Math.hypot(mx - (b.left + b.width / 2), my - (b.top + b.height / 2));
        const bTo = still ? 0 : Math.max(0, Math.min(1, 1.25 - dist / 110));
        B[i] = ease(B[i], bTo, dt, 0.12, 0.45);
        if (Math.abs(B[i] - bTo) > 0.002 || B[i] > 0.002) busy = true;
        let scale = 1;
        const ps = pulses.current.get(i);
        if (ps !== undefined) { const x = (t - ps) / 420; if (x >= 1) pulses.current.delete(i); else { scale = pulseAt(x); busy = true; } }

        const { n, ink } = tiles[i];
        const ph = tex.get(`p${n}`), mk = tex.get(`m${n}`), c = INK[ink] ?? INK["var(--b1)"];
        if (!ph || !mk) return;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ph);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mk);
        const aspect = b.width / b.height;
        const cover = (ia: number) => (aspect > ia ? [1, ia / aspect] : [aspect / ia, 1]) as [number, number];
        gl.uniform4f(U.rect, (b.left - cb.left) * dpr, (b.top - cb.top) * dpr, b.width * dpr, b.height * dpr);
        gl.uniform2f(U.coverP, ...cover(aspectOf.get(`p${n}`) ?? 1));
        gl.uniform2f(U.coverM, ...cover(aspectOf.get(`m${n}`) ?? 1));
        gl.uniform1f(U.aspect, aspect);
        gl.uniform2f(U.mouse, (mx - b.left) / b.width, (my - b.top) / b.height);
        const at = clicks.current.get(i) ?? [0.5, 0.5];
        gl.uniform2f(U.click, at[0], at[1]);
        gl.uniform3f(U.ink, c[0] / 255, c[1] / 255, c[2] / 255);
        gl.uniform1f(U.bulge, B[i]);
        gl.uniform1f(U.reveal, R[i]);
        gl.uniform1f(U.scale, scale);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      });
      if (busy && visible) raf = requestAnimationFrame(frame); else last = 0;
    };
    const go = () => { if (!raf && alive) raf = requestAnimationFrame(frame); };
    kick.current = go;

    const move = (e: PointerEvent) => { if (e.pointerType === "mouse") { mx = e.clientX; my = e.clientY; if (visible) go(); } };
    const away = () => { mx = my = -9999; go(); };
    const ro = new ResizeObserver(() => { size(); go(); });
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; go(); });
    addEventListener("pointermove", move, { passive: true });
    addEventListener("scroll", go, { passive: true });
    document.documentElement.addEventListener("pointerleave", away);
    ro.observe(w); ro.observe(cv); io.observe(w);
    size();
    const files = Array.from(new Set(tiles.map((x) => x.n)));
    Promise.all(files.flatMap((n) => {
      const file = `life-${String(n).padStart(2, "0")}`;
      return [load(`p${n}`, `/footer/draft/fx-plain/${file}.webp`, false), load(`m${n}`, `/footer/draft/${file}.webp`, true)];
    })).then(() => {
      // draw only once every image is in, so the canvas never shows half a wall
      if (!alive || tex.size < files.length * 2) return;
      loaded = true;
      setReady(true);
      go();
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", move);
      removeEventListener("scroll", go);
      document.documentElement.removeEventListener("pointerleave", away);
      ro.disconnect(); io.disconnect();
      tex.forEach((x) => gl.deleteTexture(x));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [tiles]);

  // clicks reach the tiles first (FooterTile keeps its own state for the CSS
  // fallback); here the same click drives the drawn tile
  const click = (e: MouseEvent<HTMLDivElement>) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-tile]");
    if (!el) return;
    const i = Number(el.dataset.tile), b = el.getBoundingClientRect();
    const k = kept.current, to = k.has(i) ? 0 : 1;
    if (to) k.add(i); else k.delete(i);
    clicks.current.set(i, [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height]);
    tweens.current.set(i, { from: reveal.current[i] ?? 0, to, start: performance.now() });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) pulses.current.set(i, performance.now());
    kick.current();
  };

  return (
    <div ref={wall} className={`${f.wall} ${ready ? f.drawn : ""}`} onClick={click}>
      {children}
      <canvas ref={canvas} className={f.canvas} aria-hidden="true" />
    </div>
  );
}
