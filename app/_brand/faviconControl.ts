/**
 * A tiny channel for swapping the tab-icon animation at runtime. AnimatedFavicon
 * listens; the favicon sample page calls setFaviconAnimation so a visitor can
 * try an option in their own tab strip. Pass null to go back to the default.
 */

type Seq = ReadonlyArray<readonly [string, number]>;

/**
 * An idle loop that never stops. At a loop index that a beat declares as its
 * start, the beat plays (with probability `chance`, or always once `maxLoops`
 * whole loops have passed without one) and the loop carries on from `resume`.
 * A beat's first frame is the loop frame at `at`, and its last frame hands
 * over to the loop frame at `resume`, so neither joint shows a jump.
 */
export type FaviconRing = {
  /** the idle loop: [frame, hold in ms], played round and round */
  loop: Seq;
  beats: ReadonlyArray<{ at: number; frames: Seq; resume: number }>;
  /** chance that a beat plays when its start index comes round */
  chance: number;
  /** a beat is forced after this many whole loops without one */
  maxLoops: number;
};

export type FaviconAnimation = {
  /** frame name -> data URI; "open" is required and is the resting frame */
  frames: Record<string, string>;
  /** each beat is a list of [frame, hold in ms], played one beat per rest */
  beats: ReadonlyArray<Seq>;
  /** wait between beats: [minimum ms, extra random ms] */
  rest: readonly [number, number];
  /** the frame shown between beats; defaults to "open" */
  base?: string;
  /** when set, the icon plays this ring instead of beats and rests */
  ring?: FaviconRing;
};

/**
 * Walks a ring: calls show(frame) and wait(ms, next) for each step, forever.
 * Shared by the tab icon player and the sample page's previews.
 */
export function runRing(
  ring: FaviconRing,
  show: (frame: string) => void,
  wait: (ms: number, next: () => void) => void,
  random: () => number = Math.random,
): void {
  const n = ring.loop.length;
  const loopMs = ring.loop.reduce((t, [, ms]) => t + ms, 0);
  let i = 0;
  let quiet = 0; // ms of loop played since the last beat

  const playBeat = (frames: Seq, resume: number) => {
    let k = 0;
    const next = () => {
      if (k >= frames.length) {
        i = resume;
        step();
        return;
      }
      const [f, ms] = frames[k++];
      show(f);
      wait(ms, next);
    };
    next();
  };

  const step = () => {
    const here = ring.beats.filter((b) => b.at === i);
    if (here.length && (random() < ring.chance || quiet >= ring.maxLoops * loopMs)) {
      quiet = 0;
      const b = here[Math.floor(random() * here.length)];
      playBeat(b.frames, b.resume);
      return;
    }
    const [f, ms] = ring.loop[i];
    show(f);
    quiet += ms;
    i = (i + 1) % n;
    wait(ms, step);
  };
  step();
}

type Listener = (animation: FaviconAnimation | null) => void;

const listeners = new Set<Listener>();
let active: FaviconAnimation | null = null;

export function setFaviconAnimation(animation: FaviconAnimation | null): void {
  active = animation;
  listeners.forEach((l) => l(animation));
}

export function getFaviconAnimation(): FaviconAnimation | null {
  return active;
}

export function subscribeFaviconAnimation(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
