"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import r from "./rail.module.css";

/** The phone header's section menu (Rail `menu`). The button sits at the right
    of the header bar; while it is open, rail.module.css drops the rail's own
    section list (RailNav) down under the bar, so the phone gets the same
    numbered rows and the same active row as the desktop rail. A section link,
    a tap outside, or Escape closes it. Hidden above 760px, where the rail
    shows the list itself. */
export function RailMenu() {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const rail = btn.current?.closest("aside");
    const onClick = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Element) || btn.current?.contains(t)) return;
      if (t.closest("nav a") || !rail?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btn.current?.focus(); }
    };
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <button ref={btn} type="button" className={r.menuBtn} aria-label="Sections" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
      {open ? <X size={18} strokeWidth={1.8} aria-hidden="true" /> : <Menu size={18} strokeWidth={1.8} aria-hidden="true" />}
    </button>
  );
}
