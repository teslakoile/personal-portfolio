"use client";

import { useEffect, useState } from "react";
import { runRing, setFaviconAnimation } from "../../_brand/faviconControl";
import { FRAMES, OPTIONS, type Option } from "./options";
import s from "./anim.module.css";

const BIG = (frame: string) => `/kyllm/favicon-lab/anim/${frame}-128.png`;

/** the option whose frames app/_brand/faviconFrames.ts carries (SHIP_ID in the generator) */
const SHIPPED_ID = "idle-3s";

/** Plays an option's ring, beats and all, and returns the frame currently shown. */
function useFrame(option: Option, enabled: boolean): string {
  const [frame, setFrame] = useState(option.base);
  const playing = enabled && Boolean(option.ring);

  useEffect(() => {
    const ring = option.ring;
    if (!playing || !ring) return;
    let alive = true;
    let timer: number | undefined;
    // start on the next tick, then let runRing drive the frames
    timer = window.setTimeout(() => {
      runRing(
        ring,
        (f) => {
          if (alive) setFrame(f);
        },
        (ms, next) => {
          timer = window.setTimeout(() => {
            if (alive) next();
          }, ms);
        },
      );
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [option, playing]);

  return playing ? frame : option.base;
}

function Tab({ src, dark }: { src: string; dark?: boolean }) {
  return (
    <div className={`${s.strip} ${dark ? s.dark : ""}`}>
      <span className={s.tab}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={16} height={16} />
        Kyle Naranjo
      </span>
    </div>
  );
}

function Card({
  option,
  live,
  motion,
  shipped,
  onTry,
}: {
  option: Option;
  live: boolean;
  motion: boolean;
  shipped?: boolean;
  onTry: () => void;
}) {
  const frame = useFrame(option, motion);
  const keyFrames = option.keys ?? option.frames.filter((f) => f !== "half" && f !== "closed");

  return (
    <article className={`${s.card} ${s.hero} ${live ? s.live : ""}`}>
      <div className={s.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.big} src={BIG(frame)} alt="" width={128} height={128} />
        {/* the 32 px frame a 2x tab draws, enlarged 4x without smoothing */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`${s.big} ${s.pixels}`} src={FRAMES[frame] ?? FRAMES.open} alt="" width={128} height={128} />
        <div className={s.tabs}>
          <Tab src={FRAMES[frame] ?? FRAMES.open} />
          <Tab src={FRAMES[frame] ?? FRAMES.open} dark />
        </div>
      </div>
      <header className={s.head}>
        <h3>
          <span>{option.label}</span>
          {option.name}
          <em className={s.role}>{option.role}</em>
          {shipped ? <em className={`${s.role} ${s.shipped}`}>Shipped</em> : null}
        </h3>
        <p>{option.note}</p>
      </header>
      <footer className={s.foot}>
        <div className={s.thumbs}>
          {keyFrames.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f} src={BIG(f)} alt="" width={34} height={34} />
          ))}
        </div>
        <span className={s.timing}>Always moving, with a bounce every few seconds</span>
        <button type="button" className={`${s.btn} ${live ? s.on : s.primary}`} onClick={onTry}>
          {live ? "Playing in This Tab" : "Try in My Tab"}
        </button>
      </footer>
    </article>
  );
}

function toAnimation(o: Option) {
  return { frames: FRAMES, beats: o.beats, rest: o.rest, base: o.base, ring: o.ring };
}

export function Gallery() {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [motion, setMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    // warm the 128 px frames so a preview never flashes empty
    for (const o of OPTIONS) for (const f of o.frames) new Image().src = BIG(f);
    return () => {
      mq.removeEventListener("change", sync);
      setFaviconAnimation(null);
    };
  }, []);

  const tryOption = (o: Option) => {
    setPickedId(o.id);
    setFaviconAnimation(toAnimation(o));
  };
  const reset = () => {
    setPickedId(null);
    setFaviconAnimation(null);
  };
  const live = OPTIONS.find((o) => o.id === pickedId);
  const shipped = OPTIONS.find((o) => o.id === SHIPPED_ID);

  return (
    <>
      <div className={s.bar}>
        <span>
          This tab&apos;s icon: <b>{live ? `${live.label}, ${live.name}` : "the shipped loop (every 3 s)"}</b>
        </span>
        {live ? (
          <button type="button" className={s.btn} onClick={reset}>
            Back to Shipped
          </button>
        ) : null}
        {!motion ? <span>Reduced motion is on, so previews and the tab icon stay still.</span> : null}
      </div>

      {shipped ? (
        <section className={s.section}>
          <h2>The Shipped Loop</h2>
          <div className={s.heroWrap}>
            <Card option={shipped} live={shipped.id === pickedId} motion={motion} shipped onTry={() => tryOption(shipped)} />
          </div>
        </section>
      ) : null}
    </>
  );
}
