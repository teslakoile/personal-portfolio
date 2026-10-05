import type { Metadata } from "next";
import { BrandRoot, Frame } from "../../../../_brand/kit";
import { Footer, type FooterMobile } from "../../../../_brand/sections/Footer";

/** The footer's three phone layouts, for comparison below 760px wide. */
export const metadata: Metadata = {
  title: "Footer on Phones | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const OPTIONS: { id: string; label: string; mobile: FooterMobile }[] = [
  { id: "option-strip", label: "A · Swipe Strip", mobile: "strip" },
  { id: "option-rows", label: "B · Two Rows", mobile: "rows" },
  { id: "option-drift", label: "C · Drift", mobile: "drift" },
];

export default function MobileFooters() {
  return (
    <BrandRoot>
      <div style={{ padding: "32px 0 64px", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 48 }}>
        {OPTIONS.map((o) => (
          <section key={o.id} id={o.id} aria-label={o.label}>
            <p style={{ margin: "0 20px 10px", fontSize: 14, fontWeight: 500 }}>{o.label}</p>
            <Frame><Footer mobile={o.mobile} /></Frame>
          </section>
        ))}
      </div>
    </BrandRoot>
  );
}
