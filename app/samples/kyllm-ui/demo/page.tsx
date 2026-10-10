import type { Metadata } from "next";
import Link from "next/link";
import { Demo } from "./Demo";
import s from "../kyllm.module.css";

export const metadata: Metadata = { title: "KYLLM Demo | Samples", robots: { index: false, follow: false } };

/** /samples/kyllm-ui/demo: one scripted exchange with every animation, built from the parts page. */
export default function Page() {
  return (
    <div className={s.root}>
      <nav className={s.top}>
        <b>KYLLM Demo</b>
        <Link href="/samples/kyllm-ui">Parts</Link>
        <Link href="/samples/kyllm-ui#steps">Steps</Link>
      </nav>
      <Demo />
    </div>
  );
}
