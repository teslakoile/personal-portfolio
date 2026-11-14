"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** On a phone (`media`), starts its first child, a horizontal scroll box,
    scrolled to the right end, so a timeline too wide for the screen opens on
    the present instead of the earliest year. Wider screens keep the start. */
export function ScrollToEnd({ className, media = "(max-width: 720px)", children }: { className?: string; media?: string; children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = wrap.current?.firstElementChild;
    if (!window.matchMedia(media).matches) return;
    if (box instanceof HTMLElement && box.scrollWidth > box.clientWidth) box.scrollLeft = box.scrollWidth;
  }, [media]);
  return <div ref={wrap} className={className}>{children}</div>;
}
