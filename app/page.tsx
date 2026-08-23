import { fontVars } from "./fonts";
import { HomeShell } from "./_home/HomeShell";

/**
 * Landing page, the "Quiet Blueprint" sections inside the sidebar shell
 * (app/_home/HomeShell.tsx), with the contributions graph, resources,
 * recommendations, ⌘K ask-anything, ⌘J typing test, and micro-sounds.
 * Fonts come exclusively from the global fontset (app/fonts.ts), only the
 * chosen families load here, unlike the /samples playground which loads every
 * candidate for its comparisons. The prior top-nav composition still renders
 * at /samples/home; the original text-dense homepage lives on at /classic.
 */

// Person structured data for search engines, every fact mirrors the visible
// site content.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kyle Nathan G. Naranjo",
  alternateName: "Kyle Naranjo",
  url: "https://kylenaranjo.cv",
  jobTitle: "Data Engineer II",
  worksFor: {
    "@type": "Organization",
    name: "Thinking Machines Data Science",
    url: "https://thinkingmachin.es/",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of the Philippines Diliman",
  },
  email: "mailto:kyle.naranjo@gmail.com",
  sameAs: [
    "https://linkedin.com/in/kyle-naranjo",
    "https://github.com/teslakoile",
  ],
  knowsAbout: [
    "Data Engineering",
    "AI Infrastructure",
    "Generative AI",
    "MLOps",
    "Backend Engineering",
    "Cloud Infrastructure",
  ],
};

export default function Home() {
  return (
    <div className={`${fontVars} min-h-screen w-full`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <HomeShell />
    </div>
  );
}
