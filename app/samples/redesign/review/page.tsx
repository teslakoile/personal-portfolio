import type { Metadata } from "next";
import { sample } from "../../sampleContent";
import { featureEnabled } from "../../../flags";
import { BrandRoot, Frame, Button } from "../../../_brand/kit";
import { Rail } from "../../../_brand/Rail";
import { Footer } from "../../../_brand/sections/Footer";
import { Cursor } from "../../../_brand/Cursor";
import { MotionRoot } from "../../../_brand/MotionRoot";
import { ChipFx } from "../../../_brand/ChipFx";
import { About } from "../../../_brand/sections/About";
import { Projects } from "../../../_brand/sections/Projects";
import { Experience } from "../../../_brand/sections/Experience";
import { Skills } from "../../../_brand/sections/Skills";
import { Education } from "../../../_brand/sections/Education";
import { Certifications } from "../../../_brand/sections/Certifications";
import { Community } from "../../../_brand/sections/Community";
import { Recognition } from "../../../_brand/sections/Recognition";
import { GitHub } from "../../../_brand/sections/GitHub";
import { ContactModal } from "../../../_brand/sections/ContactModal";
import { KyllmHero } from "../kyllm-hero/KyllmHero";
import { KyllmDock } from "../kyllm-hero/HeroKyllm";
import h from "../kyllm-hero/hero.module.css";
import s from "../redesign.module.css";

/**
 * /samples/redesign/review: the whole redesigned CV as it would ship, for a
 * last review before it replaces the landing page. Every section from
 * /samples/redesign (main's latest), with the hero from
 * /samples/redesign/kyllm-hero in place of the canvas hero: Kyle's photo in
 * its grid cell, Career Highlights, and the tools cascade.
 *
 * KYLLM follows FEATURE_FLAGS.kyllm in app/flags.ts, off until it has a real
 * backend: with it off there is no question bar, dock pill, chat window, or
 * "Ask KYLLM" rail button. ?kyllm=1 shows them for review without flipping
 * the flag.
 */
export const metadata: Metadata = {
  title: "Redesign Review | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "about", label: "About", num: "01" },
  { id: "projects", label: "Projects", num: "02" },
  { id: "experience", label: "Experience", num: "03" },
  { id: "skills", label: "Skills", num: "04" },
  { id: "education", label: "Education", num: "05" },
  { id: "certifications", label: "Certifications", num: "06" },
  { id: "community", label: "Community", num: "07" },
  { id: "recognition", label: "Recognition", num: "08" },
  { id: "github", label: "GitHub", num: "09" },
];

export default async function RedesignReview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const kyllm = featureEnabled("kyllm") || q.kyllm === "1";
  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <ChipFx />
        <ContactModal />
        <div className={s.page}>
          <div className={s.railWrap}>
            <Rail
              wordmark={sample.wordmark}
              items={SECTIONS}
              active="about"
              utils={kyllm ? [{ label: "Ask KYLLM", keys: ["⌘", "K"] }] : undefined}
              sound
              variant="ruled"
              foot={<Button href={sample.hero.primaryCta.href} contact>Get in Touch</Button>}
            />
          </div>
          <main className={`${s.main} ${h.content}`}>
            <Frame>
              <KyllmHero kyllm={kyllm} />
              <About />
              <Projects />
              <Experience />
              <Skills />
              <Education />
              <Certifications />
              <Community />
              <Recognition />
              <GitHub />
              <Footer />
            </Frame>
          </main>
        </div>
        {kyllm ? <KyllmDock /> : null}
      </MotionRoot>
    </BrandRoot>
  );
}
