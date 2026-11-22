import type { Metadata } from "next";
import { BrandRoot } from "../../_brand/kit";
import { Compare } from "./Compare";
import c from "./compare.module.css";

export const metadata: Metadata = { title: "KYLLM Loader | Samples", robots: { index: false, follow: false } };

/** /samples/kyllm-loader: the steps header while KYLLM works, the current step label against the chevron loading line. */
export default function Page() {
  return (
    <BrandRoot className={c.page}>
      <h1 className={c.title}>Steps Header While Working</h1>
      <p className={c.lede}>Both replay the timing of a real answer on a loop. Only the header differs while KYLLM works; the steps, strip, and finished state are the same.</p>
      <Compare />
    </BrandRoot>
  );
}
