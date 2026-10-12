"use client";

import { useEffect } from "react";
import { FaviconAnimation, getFaviconAnimation, runRing, subscribeFaviconAnimation } from "./faviconControl";

/**
 * Animates the tab icon with KYLLM: a hop, a blink, and a double blink in a
 * loop. Only Firefox animates a GIF favicon, so this swaps 32 px PNG frames
 * (scripts/kyllm/favicon_anim.py, embedded as data URIs so a swap never waits
 * on the network) by replacing the <link rel="icon"> element, which every
 * major browser re-reads.
 *
 * The icon is seen most in the tab strip while another tab is in front, so it
 * keeps animating in the background. Browsers stretch main-thread timers in
 * hidden tabs to about one per second, which would hold each 80 ms frame for a
 * full second, so the timing comes from a worker, whose timers are not
 * throttled. A tab that stays hidden settles to the static icon after
 * HIDDEN_LIMIT_MS and starts again when the visitor returns. It also stops for
 * `prefers-reduced-motion`. The static icons (app/icon.png, app/favicon.ico)
 * are the same open frame, so crawlers and no-script visitors see the same mark.
 *
 * faviconControl.setFaviconAnimation swaps in another animation at runtime
 * (the favicon sample page uses it to preview options in the real tab). An
 * animation with a `ring` plays an idle loop that never stops, with beats that
 * cut in and hand back (faviconControl.runRing), under the same clock, hidden
 * tab limit and reduced motion rules.
 */

type Beat = ReadonlyArray<readonly [string, number]>;

const HIDDEN_LIMIT_MS = 2 * 60 * 1000;

export function AnimatedFavicon() {
  useEffect(() => {
    const head = document.head;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let teardown: (() => void) | undefined;

    import("./faviconFrames").then(({ FAVICON_BASE, FAVICON_FRAMES, FAVICON_RING }) => {
      if (cancelled) return;
      // the shipped loop: option AB, an idle ring that never stops with a beat cut in now and then
      const fallback: FaviconAnimation = {
        frames: { ...FAVICON_FRAMES, open: FAVICON_FRAMES[FAVICON_BASE] },
        beats: [],
        rest: [0, 0],
        base: FAVICON_BASE,
        ring: FAVICON_RING,
      };
      teardown = start(head, reduced, fallback);
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return null;
}

type Clock = {
  after: (ms: number, fn: () => void) => number;
  cancel: (id: number) => void;
  close: () => void;
};

/**
 * Timers that keep their pace in a hidden tab. Falls back to window timers
 * when a worker cannot be created (a strict CSP, an old browser).
 */
function makeClock(): Clock {
  const pending = new Map<number, () => void>();
  let next = 1;
  let worker: Worker | undefined;
  let url: string | undefined;
  try {
    url = URL.createObjectURL(
      new Blob(["onmessage=e=>setTimeout(()=>postMessage(e.data.id),e.data.ms)"], {
        type: "text/javascript",
      }),
    );
    worker = new Worker(url);
    worker.onmessage = (e: MessageEvent<number>) => {
      const fn = pending.get(e.data);
      if (fn) {
        pending.delete(e.data);
        fn();
      }
    };
  } catch {
    worker = undefined;
  }

  return {
    after(ms, fn) {
      const id = next++;
      pending.set(id, fn);
      if (worker) {
        worker.postMessage({ id, ms });
      } else {
        window.setTimeout(() => {
          const f = pending.get(id);
          if (f) {
            pending.delete(id);
            f();
          }
        }, ms);
      }
      return id;
    },
    cancel(id) {
      pending.delete(id);
    },
    close() {
      pending.clear();
      worker?.terminate();
      if (url) URL.revokeObjectURL(url);
    },
  };
}

function start(
  head: HTMLHeadElement,
  reduced: MediaQueryList,
  fallback: FaviconAnimation,
): () => void {
  let anim: FaviconAnimation = getFaviconAnimation() ?? fallback;

  // Take over the icon links. Next streams its own <link rel="icon"> tags
  // into the head after this effect runs, and when two icon links are
  // present the browser may pick the static one. React owns those nodes and
  // throws if they are detached, so they stay in the DOM with their rel
  // renamed, and an observer does the same to any that arrive later.
  const STATIC_REL = "x-kyllm-static";
  const stash: HTMLLinkElement[] = [];
  const isOther = (n: Node): n is HTMLLinkElement =>
    n instanceof HTMLLinkElement && n.relList.contains("icon") && !("kyllm" in n.dataset);
  const sweep = () => {
    for (const n of Array.from(head.children)) {
      if (isOther(n)) {
        n.dataset.kyllmRel = n.rel;
        n.rel = STATIC_REL;
        stash.push(n);
      }
    }
  };
  const observer = new MutationObserver(sweep);
  const clock = makeClock();

  const make = (href: string) => {
    const el = document.createElement("link");
    el.rel = "icon";
    el.type = "image/png";
    el.sizes.add("32x32");
    el.dataset.kyllm = "";
    el.href = href;
    return el;
  };

  let current: HTMLLinkElement | undefined;
  const show = (frame: string) => {
    const href = anim.frames[frame] ?? anim.frames.open;
    if (!href) return;
    const next = make(href);
    if (current?.isConnected) current.replaceWith(next);
    else head.appendChild(next);
    current = next;
  };

  let timer: number | undefined;
  let limit: number | undefined;
  let beat = 0;

  const clear = () => {
    if (timer !== undefined) clock.cancel(timer);
    if (limit !== undefined) clock.cancel(limit);
    timer = limit = undefined;
  };

  const baseFrame = () => anim.base ?? "open";

  const stop = () => {
    clear();
    if (current?.isConnected) show(baseFrame());
  };

  const play = (seq: Beat, done: () => void) => {
    let i = 0;
    const step = () => {
      if (i >= seq.length) {
        show(baseFrame());
        done();
        return;
      }
      const [frame, ms] = seq[i++];
      show(frame);
      timer = clock.after(ms, step);
    };
    step();
  };

  const rest = () => {
    const [min, span] = anim.rest;
    timer = clock.after(min + Math.random() * span, () =>
      play(anim.beats[beat++ % anim.beats.length], rest),
    );
  };

  // (Re)start the loop. A hidden tab gets a time limit so a tab left open in
  // the background does not keep moving for hours.
  const sync = () => {
    stop();
    if (reduced.matches) return;
    if (anim.ring) {
      runRing(anim.ring, show, (ms, next) => {
        timer = clock.after(ms, next);
      });
    } else {
      rest();
    }
    if (document.hidden) limit = clock.after(HIDDEN_LIMIT_MS, stop);
  };

  const unsubscribe = subscribeFaviconAnimation((next) => {
    anim = next ?? fallback;
    beat = 0;
    show(baseFrame());
    sync();
  });

  try {
    sweep();
    observer.observe(head, { childList: true });
    show(baseFrame());
    sync();
  } catch {
    // leave whatever icon is in place
  }

  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  return () => {
    unsubscribe();
    document.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", sync);
    clear();
    clock.close();
    observer.disconnect();
    current?.remove();
    for (const o of stash) {
      o.rel = o.dataset.kyllmRel ?? "icon";
      delete o.dataset.kyllmRel;
    }
  };
}
