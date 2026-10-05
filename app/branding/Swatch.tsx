"use client";

import { useEffect, useRef } from "react";
import s from "./branding.module.css";

/**
 * One color token. The chip paints with the token itself and the hex label is
 * read back from the computed style, so the sheet can never disagree with
 * app/_brand/brand.module.css.
 */
export function Swatch({ token, use }: { token: string; use: string }) {
  const hex = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = hex.current;
    if (!el) return;
    el.textContent = getComputedStyle(el).getPropertyValue(`--${token}`).trim();
  }, [token]);

  return (
    <div className={s.swatch}>
      <div className={s.swatchChip} style={{ background: `var(--${token})` }} />
      <div className={s.swatchBody}>
        <span className={s.name}>--{token}</span>
        <span ref={hex} className={s.hex} />
        <span className={s.note}>{use}</span>
      </div>
    </div>
  );
}
