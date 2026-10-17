import { sample } from "../samples/sampleContent";
import { PROJECTS } from "../_brand/sections/projectsData";
import { CV } from "./cv";
import { LINKS, SECTIONS } from "./protocol";

/**
 * What KYLLM knows: the CV first, then the site's own content, section by
 * section, under the ids an answer cites. Only real content goes in: the
 * mock recommendations, the starter resources list, the unpublished blog, and
 * the older bank-centred projects list in sampleContent.ts stay out.
 * LinkedIn is not here yet; add its About and recommendations once they are
 * exported. The string is built once and never changes at runtime, so the
 * system prompt that carries it caches.
 */

const json = (v: unknown) => JSON.stringify(v, null, 1);

const site = {
  about: { headline: sample.hero.headline, subhead: sample.hero.subhead, paragraphs: sample.about, focusAreas: sample.focusAreas },
  projects: PROJECTS.map(({ kind, year, name, lede, detail, role, stack, links }) => ({ kind, year, name, lede, detail, role, stack, links: links?.map((l) => l.href) })),
  experience: sample.experience,
  skills: sample.skills,
  education: sample.education,
  certifications: sample.certifications.map(({ issuer, title, blurb, issued, expires }) => ({ issuer, title, blurb, issued, expires })),
  community: { organizations: sample.community.map(({ name, role, period, url, description }) => ({ name, role, period, url, description })), talks: sample.speaking },
  recognition: sample.achievements,
  github: { user: sample.github.user, url: sample.github.url },
};

export const KNOWLEDGE = [
  "<cv>",
  CV,
  "</cv>",
  "",
  "<site>",
  ...Object.entries(SECTIONS).map(([id, label]) => `<section id="${id}" label="${label}">\n${json(site[id as keyof typeof site])}\n</section>`),
  "</site>",
  "",
  "<links>",
  ...Object.entries(LINKS).map(([id, l]) => `${id}: ${l.label}, ${l.href}`),
  "</links>",
].join("\n");
