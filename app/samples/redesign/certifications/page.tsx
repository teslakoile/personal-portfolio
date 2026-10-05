import type { Metadata } from "next";
import { BrandRoot, Frame } from "../../../_brand/kit";
import { Certifications, type CertVariant } from "../../../_brand/sections/Certifications";

/** Certification layouts side by side, for picking one. */
export const metadata: Metadata = {
  title: "Certifications Options | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const OPTIONS: { id: string; label: string; variant: CertVariant }[] = [
  { id: "option-b", label: "B · By Issuer (chosen)", variant: "issuer" },
  { id: "option-a", label: "A · Registry", variant: "registry" },
  { id: "option-c", label: "C · Compact List", variant: "compact" },
  { id: "option-current", label: "Current · Block Timeline", variant: "timeline" },
];

export default function CertificationOptions() {
  return (
    <BrandRoot>
      <div style={{ padding: "40px 24px 80px", display: "grid", gap: 56 }}>
        {OPTIONS.map((o) => (
          <section key={o.id} id={o.id} aria-label={o.label}>
            <p style={{ maxWidth: 1080, margin: "0 auto 12px", fontSize: 14, fontWeight: 500 }}>{o.label}</p>
            <Frame><Certifications num="06" variant={o.variant} /></Frame>
          </section>
        ))}
      </div>
    </BrandRoot>
  );
}
