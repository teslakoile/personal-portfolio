import type { Metadata } from "next";
import { sample } from "../sampleContent";
import { BrandRoot, Frame, Rail, Button } from "../../_brand/kit";
import { Footer } from "../../_brand/sections/Footer";
import { Cursor } from "../../_brand/Cursor";
import { MotionRoot } from "../../_brand/MotionRoot";
import { Certifications } from "../../_brand/sections/Certifications";
import { AskPanel } from "../../_brand/sections/AskPanel";
import s from "./redesign.module.css";

/**
 * The redesign, rebuilt one section at a time from app/_brand (the review copy
 * lives on the Claude Design canvas "Portfolio Redesign"). Sections keep their
 * final numbers, so this partial page reads "06 Certifications". Add each new
 * section to SECTIONS and to the frame in page order.
 */
export const metadata: Metadata = {
  title: "Redesign | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const SECTIONS = [{ id: "certifications", label: "Certifications", num: "06" }];

export default function RedesignPage() {
  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <AskPanel />
        <div className={s.page}>
          <div className={s.railWrap}>
            <Rail
              wordmark={sample.wordmark}
              items={SECTIONS}
              active="certifications"
              utils={[{ label: "Ask KYLLM", keys: ["⌘", "K"] }]}
              foot={<Button href={sample.hero.primaryCta.href}>Get in Touch</Button>}
            />
          </div>
          <main className={s.main}>
            <Frame>
              <Certifications num="06" />
              <p className={s.pending}>Next: the remaining sections, added one at a time.</p>
              <Footer />
            </Frame>
          </main>
        </div>
      </MotionRoot>
    </BrandRoot>
  );
}
