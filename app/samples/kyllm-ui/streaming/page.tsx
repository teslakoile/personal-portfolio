import type { Metadata } from "next";
import Link from "next/link";
import { Cursor } from "../../../_brand/Cursor";
import { ReviewProvider } from "../review/Review";
import { isDev, readReviews } from "../review/store";
import { Streaming } from "./Streaming";
import s from "../kyllm.module.css";

export const metadata: Metadata = { title: "KYLLM Streaming | Samples", robots: { index: false, follow: false } };

/** /samples/kyllm-ui/streaming: the answer stream as it is now, next to three alternatives, replaying in sync. */
export default async function Page() {
  const reviews = await readReviews();
  return (
    <div className={s.root}>
      <Cursor />
      <ReviewProvider initial={reviews} enabled={isDev}>
        <nav className={s.top}>
          <b>KYLLM Streaming</b>
          <Link href="/samples/kyllm-ui/demo">Demo</Link>
          <Link href="/samples/kyllm-ui">Parts</Link>
        </nav>
        <Streaming />
      </ReviewProvider>
    </div>
  );
}
