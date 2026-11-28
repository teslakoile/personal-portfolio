import type { ReactNode } from "react";
import { sample } from "../samples/sampleContent";
import { sectionEnabled } from "../flags";
import { BrandRoot, Frame, Button } from "./kit";
import { Rail } from "./Rail";
import { Footer } from "./sections/Footer";
import { Cursor } from "./Cursor";
import { MotionRoot } from "./MotionRoot";
import { ChipFx } from "./ChipFx";
import { UiSound } from "./UiSound";
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
 *
 * `refined` turns on the 2026-11-27 design-audit fixes (/samples/refined shows
 * them without the rest): every rule they add sits under
 * [data-refined] in the section stylesheets, the phone header gains a
 * section menu, and the KYLLM pill steps aside over the hero's question bar
 * and the footer links.
 *
 * `polish` adds the visual-alignment pass on top of `refined`. The landing
 * page has rendered with it since 2026-11-28, and so does /samples/polished: its rules sit under [data-polish]. Vertical rules land on
 * shared lines across sections, project cards share rows, and a role's date
 * and chevron sit on its title's line.
 *
 * `polish` also carries Kyle's picks of 2026-11-27: solid hairline chips, a
 * site link labelled with its host name, and one key cap on the rail.
 *
 * `options` are the choices put to Kyle, switched with a toggle bar at
 * /samples/polished/options. The landing page passes `covers`, which he
 * picked on 2026-11-28 at three across. The list: project covers (one product
 * UI on a generated ground),
 * the earlier covers that scale a full-size screen down (the fallback),
 * two projects across, and the footer wall in the Career Highlights' dark
 * shades or halfway to them. The others are still open.
 */
export const SITE_OPTIONS = ["covers", "fallback", "wide", "footer", "footermid"] as const;
export type SiteOption = (typeof SITE_OPTIONS)[number];

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

export function SitePage({ kyllm, refined: refinedOnly = false, polish = false, options = [] }: { kyllm: boolean; refined?: boolean; polish?: boolean; options?: SiteOption[] }) {
  const refined = refinedOnly || polish;
  const has = (o: SiteOption) => options.includes(o);
  const shown = SECTIONS.filter((x) => sectionEnabled(x.id));
  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <ChipFx />
        <UiSound />
        <ContactModal />
        <div className={s.page} data-refined={refined ? "" : undefined} data-polish={polish ? "" : undefined} data-opt={options.length ? options.join(" ") : undefined}>
          <div className={s.railWrap}>
            <Rail
              wordmark={sample.wordmark}
              items={shown.map((x, i) => ({ id: x.id, label: x.label, num: String(i + 1).padStart(2, "0") }))}
              active={shown[0]?.id ?? "about"}
              utils={kyllm ? [{ label: "Ask KYLLM", keys: polish ? ["⌘K"] : ["⌘", "K"] }] : undefined}
              sound
              variant="ruled"
              menu={refined}
              foot={<Button href={sample.hero.primaryCta.href} contact>Get in Touch</Button>}
            />
          </div>
          <main className={`${s.main} ${h.content}`}>
            <Frame>
              <KyllmHero kyllm={kyllm} />
              {shown.map((x) => (x.id === "projects" && polish ? <Projects key="projects" covers={has("covers")} coverSet={has("fallback") ? "fallback" : "redesign"} hostLabels /> : x.node))}
              <Footer tone={has("footermid") ? "mid" : has("footer") ? "dark" : "light"} />
            </Frame>
          </main>
        </div>
        {kyllm ? <KyllmDock avoid={refined} /> : null}
      </MotionRoot>
    </BrandRoot>
  );
}
