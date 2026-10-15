"use client";

import { useState } from "react";
import { Cursor, CursorSpecimen, type BusyStyle } from "../../_brand/Cursor";
import s from "./cursorStates.module.css";

const BUSY: { v: BusyStyle; label: string; note: string }[] = [
  { v: "plain", label: "No Outline", note: "Orange word and chevron, nothing behind them. Cleanest on empty surfaces." },
  { v: "outline", label: "White Outline", note: "A paper outline around each letter and a thin edge on the chevron." },
  { v: "glow", label: "Soft Glow", note: "A paper glow behind the whole line, no hard edge." },
];

export function Playground() {
  const [busy, setBusy] = useState<BusyStyle>("outline");
  return (
    <>
      <Cursor busy={busy} />

      <section className={s.sheet} aria-label="Busy over page text">
        <h2 className={s.sheetTitle}>Busy Over Text</h2>
        <div className={s.overs}>
          {BUSY.map((o) => (
            <figure key={o.v} className={s.over}>
              <div className={s.overStage}>
                <p className={s.overText}>KYLLM is reading the CV and matching your question to what it says about the pipelines.</p>
                <div className={s.overCursor}><CursorSpecimen shape="arrow" state="busy" busy={o.v} /></div>
              </div>
              <figcaption><strong>{o.label}</strong><span>{o.note}</span></figcaption>
            </figure>
          ))}
        </div>
        <div className={s.seg} role="radiogroup" aria-label="Busy style for the live cursor">
          {BUSY.map((o) => (
            <button key={o.v} type="button" role="radio" aria-checked={o.v === busy}
              className={o.v === busy ? s.segOn : undefined} onClick={() => setBusy(o.v)}>
              {o.label}
            </button>
          ))}
        </div>
        <p className={s.pickNote}>The switch sets the live cursor. Hover the Busy card below to feel it.</p>
      </section>

      <section className={s.sheet} aria-label="All states side by side">
        <h2 className={s.sheetTitle}>The States</h2>
        <div className={s.specimens}>
          <Spec name="Rest"><CursorSpecimen shape="arrow" state="rest" /></Spec>
          <Spec name="Link"><CursorSpecimen shape="hand" state="link" /></Spec>
          <Spec name="Field"><CursorSpecimen shape="ibeam" state="field" /></Spec>
          <Spec name="Selectable Text"><CursorSpecimen shape="ibeam" state="text" /></Spec>
          <Spec name="Busy"><CursorSpecimen shape="arrow" state="busy" busy={busy} /></Spec>
          <Spec name="Blocked"><CursorSpecimen shape="disc" state="blocked" /></Spec>
        </div>
      </section>

      <div className={s.grid}>
        <Card name="Rest" rule="Anything not listed below">
          <div className={s.plain}>Plain surface</div>
        </Card>
        <Card name="Link" rule="a[href], button, summary, [role=button]">
          <a className={s.chip} href="#cursor-states">Internal link</a>
        </Card>
        <Card name="Field" rule="input, textarea, [contenteditable]">
          <input className={s.field} placeholder="Type here" aria-label="Text field" />
        </Card>
        <Card name="Selectable Text" rule="A line of text you can highlight: the I-beam, anywhere it appears">
          <p className={s.prose}>
            Pipelines are rarely the hard part. The hard part is a team that trusts the numbers, so the work is
            mostly naming things clearly and writing down what each table means.
          </p>
        </Card>
        <Card name="Text You Cannot Select" rule="user-select: none stays an arrow">
          <p className={`${s.prose} ${s.noSelect}`}>This sentence has user-select turned off, so the pointer does not offer a highlight.</p>
        </Card>
        <Card name="Blocked" rule=":disabled, [aria-disabled=true], [data-blocked]">
          <button type="button" className={s.chip} aria-disabled="true">Send (rate limit reached)</button>
        </Card>
        <Card name="Busy" rule="[aria-busy=true], [data-busy]">
          <div className={s.plain} aria-busy="true">KYLLM is reading the CV</div>
        </Card>
      </div>
    </>
  );
}

function Card({ name, rule, children }: { name: string; rule: string; children: React.ReactNode }) {
  return (
    <section className={s.card}>
      <h2 className={s.name}>{name}</h2>
      <p className={s.rule}>{rule}</p>
      <div className={s.target}>{children}</div>
    </section>
  );
}

function Spec({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <figure className={s.spec}>
      <div className={s.specStage}>{children}</div>
      <figcaption>{name}</figcaption>
    </figure>
  );
}
