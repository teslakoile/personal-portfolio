import type { Metadata } from "next";
import { BrandRoot, Frame } from "../../_brand/kit";
import { Playground } from "./Playground";
import s from "./cursorStates.module.css";

/**
 * /samples/cursor-states: the drawn cursor's states (app/_brand/Cursor.tsx)
 * on targets you can hover. States come from the element's own attributes,
 * never from a label written for the cursor.
 */
export const metadata: Metadata = { title: "Cursor States | Samples", robots: { index: false, follow: false } };

export default function CursorStatesPage() {
  return (
    <BrandRoot>
      <Frame>
        <main id="cursor-states" className={s.page}>
          <h1 className={s.title}>Cursor States</h1>
          <p className={s.lede}>Move the pointer over each card. The rule under the name is the attribute that triggers it.</p>
          <Playground />
        </main>
      </Frame>
    </BrandRoot>
  );
}
