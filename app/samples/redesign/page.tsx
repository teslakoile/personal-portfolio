import type { Metadata } from "next";
import { sample } from "../sampleContent";
import { BrandRoot, Frame, Button } from "../../_brand/kit";
import { Rail } from "../../_brand/Rail";
import { Footer } from "../../_brand/sections/Footer";
import { Cursor } from "../../_brand/Cursor";
import { MotionRoot } from "../../_brand/MotionRoot";
import { ChipFx } from "../../_brand/ChipFx";
import { SoundToggle } from "../../_brand/SoundToggle";
import { Hero } from "../../_brand/sections/Hero";
import { About } from "../../_brand/sections/About";
import { Projects } from "../../_brand/sections/Projects";
import { Experience } from "../../_brand/sections/Experience";
import { Skills } from "../../_brand/sections/Skills";
import { Education } from "../../_brand/sections/Education";
import { Certifications } from "../../_brand/sections/Certifications";
import { Community } from "../../_brand/sections/Community";
import { Recognition } from "../../_brand/sections/Recognition";
import { GitHub } from "../../_brand/sections/GitHub";
import { AskPanel } from "../../_brand/sections/AskPanel";
import s from "./redesign.module.css";

/**
 * The redesign, the whole page: every section rebuilt from app/_brand in the
 * order and numbering of the "Portfolio Redesign" canvas (About 01 through
 * GitHub 09), with the closing photo-wall footer, the rail, the drawn cursor,
 * and the Ask KYLLM panel. Writing, Recommendations, and Resources stay off
 * the page until their content is real, as on the landing page's flags. The
 * single-section view of Certifications lives at /samples/redesign/certifications.
 */
export const metadata: Metadata = {
  title: "Redesign | Kyle Naranjo",
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

export default function RedesignPage() {
  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <ChipFx />
        <AskPanel />
        <div className={s.page}>
          <div className={s.railWrap}>
            <Rail
              wordmark={sample.wordmark}
              items={SECTIONS}
              active="about"
              utils={[{ label: "Ask KYLLM", keys: ["⌘", "K"] }]}
              foot={(
                <>
                  <SoundToggle />
                  <div style={{ marginTop: 14 }}><Button href={sample.hero.primaryCta.href}>Get in Touch</Button></div>
                </>
              )}
            />
          </div>
          <main className={s.main}>
            <Frame>
              <Hero />
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
      </MotionRoot>
    </BrandRoot>
  );
}
