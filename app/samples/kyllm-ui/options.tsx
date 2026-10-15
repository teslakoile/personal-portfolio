"use client";

import type { ReactNode } from "react";
import { SquarePen } from "lucide-react";
import { Avatar, ICON, Pill } from "./kit";
import s from "./kyllm.module.css";
import o from "./options.module.css";

/*
 * Option grid for /samples/kyllm-ui: each option is labelled A, B, C... to
 * match the picker under its part. Round 3 options live in round3.tsx.
 */

/** Two options a row by default; `narrow` fits four when each option is small. */
export function Opts({ narrow, children }: { narrow?: boolean; children: ReactNode }) {
  return <div className={narrow ? `${o.opts} ${o.narrow}` : o.opts}>{children}</div>;
}

export function Opt({ id, name, rec, children }: { id: string; name: string; rec?: boolean; children: ReactNode }) {
  return (
    <div className={o.opt}>
      <div className={o.optHead}><b>{id}</b>{name}{rec ? <em>Recommended</em> : null}</div>
      <div className={o.optBody}>{children}</div>
    </div>
  );
}

/* -------------------------------- off-topic ------------------------------ */
function Said({ children }: { children: ReactNode }) {
  return <div className={o.said}><Avatar size={28} /><div>{children}</div></div>;
}

export function OffTopicOptions() {
  return (
    <>
      <div className={o.asked}>Visitor asks: <q>Can you write me a pirate poem?</q></div>
      <Opts>
        <Opt id="A" name="Decline, then starters" rec>
          <Said>I only know Kyle&apos;s work, so I&apos;ll pass on that one. Try one of these:
            <div className={o.row}><Pill arrow>Give me the 30-second version</Pill><Pill arrow>How does the MCP server work?</Pill></div>
          </Said>
        </Opt>
        <Opt id="B" name="Hand off to Kyle">
          <Said>That&apos;s not in Kyle&apos;s CV. You can ask him directly.
            <div className={o.row}><Pill kind="primary">Email Kyle</Pill><Pill arrow>Back to his work</Pill></div>
          </Said>
        </Opt>
        <Opt id="C" name="Closest topic">
          <Said>I can&apos;t help with that. The closest thing I can help with is his talks:
            <div className={o.row}><Pill arrow>Which talks has he given?</Pill></div>
          </Said>
        </Opt>
        <Opt id="D" name="Playful">
          <Said>I&apos;m a cat who has read exactly one CV. Ask me about it:
            <div className={o.row}><Pill arrow>What does he work on?</Pill><Pill arrow>Is he open to new roles?</Pill></div>
          </Said>
        </Opt>
      </Opts>
    </>
  );
}

/* ------------------------------ panel header ----------------------------- */
function Head({ right }: { right?: ReactNode }) {
  return <div className={`${s.panelHead} ${o.head}`}><Avatar size={32} />KYLLM<span className={s.r}>{right}</span></div>;
}

export function HeaderOptions() {
  return (
    <Opts>
      <Opt id="A" name="New chat appears after a question" rec>
        <div className={o.stack}>
          <small className={o.label}>Empty</small><Head />
          <small className={o.label}>After the first question</small><Head right={<Pill>New chat</Pill>} />
        </div>
      </Opt>
      <Opt id="B" name="Icon button">
        <div className={o.stack}>
          <small className={o.label}>Empty</small><Head />
          <small className={o.label}>After the first question</small>
          <Head right={<button type="button" className={s.iconBtn} aria-label="New chat" title="New chat"><SquarePen size={ICON.size} strokeWidth={ICON.strokeWidth} aria-hidden="true" /></button>} />
        </div>
      </Opt>
      <Opt id="C" name="Always there, off when empty">
        <div className={o.stack}>
          <small className={o.label}>Empty</small><Head right={<span className={o.off}><Pill>New chat</Pill></span>} />
          <small className={o.label}>After the first question</small><Head right={<Pill>New chat</Pill>} />
        </div>
      </Opt>
    </Opts>
  );
}
