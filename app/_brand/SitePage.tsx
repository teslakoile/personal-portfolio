import type { ReactNode } from "react";
import { sample } from "../samples/sampleContent";
import { sectionEnabled } from "../flags";
import { BrandRoot, Frame, Button } from "./kit";
import { Rail } from "./Rail";
import { Footer } from "./sections/Footer";
import { Cursor } from "./Cursor";
import { MotionRoot } from "./MotionRoot";
import { ChipFx } from "./ChipFx";
import { About } from "./sections/About";
import { Projects } from "./sections/Projects";
import { Experience } from "./sections/Experience";
import { Skills } from "./sections/Skills";
import { Education } from "./sections/Education";
import { Certifications } from "./sections/Certifications";
import { Community } from "./sections/Community";
import { Recognition } from "./sections/Recognition";
import { GitHub } from "./sections/GitHub";
import { ContactModal } from "./sections/ContactModal";
import { KyllmHero } from "../samples/redesign/kyllm-hero/KyllmHero";
import { KyllmDock } from "../samples/redesign/kyllm-hero/HeroKyllm";
import h from "../samples/redesign/kyllm-hero/hero.module.css";
import s from "../samples/redesign/redesign.module.css";

/**
 * The redesigned CV, the whole page: the hero (Kyle's photo in its grid cell,
 * Career Highlights, the tools cascade), then every section from app/_brand,
 * then the photo-wall footer, beside the ruled rail. The landing page (/)
 * renders it, and so does /samples/redesign/review.
 *
 * Sections follow SECTION_FLAGS (app/flags.ts): a section that is off leaves
 * the page and the rail, and the rail renumbers around it (`next dev` shows
 * every section). `kyllm` shows KYLLM: the hero's question bar, the "Ask
 * KYLLM" rail button, and the chat window; the landing page passes
 * FEATURE_FLAGS.kyllm.
 */

const SECTIONS: { id: string; label: string; node: ReactNode }[] = [
  { id: "about", label: "About", node: <About key="about" /> },
  { id: "projects", label: "Projects", node: <Projects key="projects" /> },
  { id: "experience", label: "Experience", node: <Experience key="experience" /> },
  { id: "skills", label: "Skills", node: <Skills key="skills" /> },
  { id: "education", label: "Education", node: <Education key="education" /> },
  { id: "certifications", label: "Certifications", node: <Certifications key="certifications" /> },
  { id: "community", label: "Community", node: <Community key="community" /> },
  { id: "recognition", label: "Recognition", node: <Recognition key="recognition" /> },
  { id: "github", label: "GitHub", node: <GitHub key="github" /> },
];

export function SitePage({ kyllm }: { kyllm: boolean }) {
  const shown = SECTIONS.filter((x) => sectionEnabled(x.id));
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
              items={shown.map((x, i) => ({ id: x.id, label: x.label, num: String(i + 1).padStart(2, "0") }))}
              active={shown[0]?.id ?? "about"}
              utils={kyllm ? [{ label: "Ask KYLLM", keys: ["⌘", "K"] }] : undefined}
              sound
              variant="ruled"
              foot={<Button href={sample.hero.primaryCta.href} contact>Get in Touch</Button>}
            />
          </div>
          <main className={`${s.main} ${h.content}`}>
            <Frame>
              <KyllmHero kyllm={kyllm} />
              {shown.map((x) => x.node)}
              <Footer />
            </Frame>
          </main>
        </div>
        {kyllm ? <KyllmDock /> : null}
      </MotionRoot>
    </BrandRoot>
  );
}
