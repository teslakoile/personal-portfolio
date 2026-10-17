import type { CSSProperties } from "react";
import { Hero } from "../../../_brand/sections/Hero";
import { KyllmPromo } from "./KyllmPromo";
import { ToolsBand } from "./ToolsBand";
import h from "./hero.module.css";

/*
 * The redesign's grid hero (app/_brand/sections/Hero.tsx: headline, actions,
 * contact links, then the strip and tools band) with Kyle's photo in the
 * share-image treatment in place of the halftone: Kyle in his own colour over
 * a dither of the photo in its own colours, built by
 * scripts/hero/build_hero_color.py. The hero sits on the strip's columns, so
 * the photo fills a cell whose left rule is the one the strip and the tools
 * band share. Under the contact links, a bar promotes KYLLM; it opens the
 * bottom-right sheet. The strip shows four projects instead of the Single
 * Customer View's metrics; every figure is from sampleContent.ts. The tools
 * band cascades to the next six tools every 4 s.
 */

/*
 * Career Highlights in four cards: a name at the top, a description at the
 * bottom, figures only where they are natural. Experience (CV),
 * Certifications, Industries, and Speaking (sampleContent.ts). Each card is
 * toned in one of the brand's data colours, its image one photo or mark,
 * dithered in that colour; images by scripts/hero/build_work_cards.py.
 */
type Card = { name: string; description: string; slug: string; ground: string };

const HIGHLIGHTS: Card[] = [
  { name: "Experience", description: "4+ years building software products, data platforms, and AI agents for enterprises and startups", slug: "experience", ground: "#9e2a16" },
  { name: "Certifications", description: "10 professional certifications across OpenAI, AWS, Azure, Google Cloud, and Databricks", slug: "certifications", ground: "#2c4a66" },
  { name: "Industries", description: "Built for clients in financial services, investment management, education, and compliance", slug: "industries", ground: "#2f6b4f" },
  { name: "Speaking", description: "International, national, and local talks on AI coding agents, generative AI, and engineering workflows", slug: "speaking", ground: "#7a4e0c" },
];

function Highlights() {
  return (
    <div className={h.hl}>
      <div className={h.hlLabel}>Career Highlights</div>
      {HIGHLIGHTS.map((w) => (
        <article key={w.slug} className={h.workCard} style={{ "--ground": w.ground } as CSSProperties}>
          <div className={h.workImg} style={{ backgroundImage: `url(/projects/cards/${w.slug}.webp)` }} aria-hidden="true" />
          <span className={h.workName}>{w.name}</span>
          <p className={h.workBody}>{w.description}</p>
        </article>
      ))}
    </div>
  );
}

export function KyllmHero({ slow = 1 }: { slow?: number }) {
  return (
    <Hero
      aligned
      extra={<KyllmPromo />}
      strip={<Highlights />}
      tools={<ToolsBand slow={slow} />}
      portrait={
        <div className={h.photoCell}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/portrait-hero-color.webp" alt="Kyle Naranjo at the Golden Gate Bridge" width={750} height={886} />
        </div>
      }
    />
  );
}
