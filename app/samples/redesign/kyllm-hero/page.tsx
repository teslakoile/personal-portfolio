import type { Metadata } from "next";
import { sample } from "../../sampleContent";
import { BrandRoot, Frame, Button } from "../../../_brand/kit";
import { Rail } from "../../../_brand/Rail";
import { Cursor } from "../../../_brand/Cursor";
import { MotionRoot } from "../../../_brand/MotionRoot";
import { About } from "../../../_brand/sections/About";
import { Projects } from "../../../_brand/sections/Projects";
import type { SiteMark } from "../../kyllm-ui/brandIcons";
import { KyllmHero } from "./KyllmHero";
import { KyllmDock } from "./HeroKyllm";
import h from "./hero.module.css";
import s from "../redesign.module.css";

/**
 * /samples/redesign/kyllm-hero: the redesign page with Kyle's photo in a cell
 * of the grid hero, a bar under the contact links promoting KYLLM, and
 * KYLLM as a dock pill that opens a sheet; ?tools=flip|marquee|wave|groups|slot picks how
 * the tools band moves;
 * the sheet opens on the mock "tell me about Kyle" exchange, answered.
 * ?mark=kn|hash|none picks this site's source mark. The first two sections
 * follow so the hero is seen in the page's rhythm.
 */
export const metadata: Metadata = {
  title: "KYLLM Hero | Redesign",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "about", label: "About", num: "01" },
  { id: "projects", label: "Projects", num: "02" },
];

export default async function KyllmHeroPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const site: SiteMark = q.mark === "hash" || q.mark === "none" ? q.mark : "kn";
  return (
    <BrandRoot>
      <MotionRoot>
        <Cursor />
        <div className={s.page}>
          <div className={s.railWrap}>
            <Rail
              wordmark={sample.wordmark}
              items={SECTIONS}
              active="about"
              utils={[{ label: "Ask KYLLM", keys: ["⌘", "K"] }]}
              foot={<Button href={sample.hero.primaryCta.href}>Get in Touch</Button>}
            />
          </div>
          <main className={`${s.main} ${h.content}`}>
            <Frame>
              <KyllmHero tools={q.tools === "marquee" || q.tools === "wave" || q.tools === "groups" || q.tools === "slot" ? q.tools : "flip"} />
              <About num="01" />
              <Projects num="02" />
            </Frame>
          </main>
          <KyllmDock site={site} />
        </div>
      </MotionRoot>
    </BrandRoot>
  );
}
