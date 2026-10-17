import { fontVars } from "./fonts";
import { featureEnabled } from "./flags";
import { SitePage } from "./_brand/SitePage";

/**
 * Landing page: the redesigned CV (app/_brand/SitePage.tsx), shipped
 * 2026-10-17. Sections follow SECTION_FLAGS and KYLLM follows
 * FEATURE_FLAGS.kyllm (app/flags.ts). The previous "Quiet Blueprint" landing
 * page is app/_home/HomeShell.tsx; the original text-dense homepage lives on
 * at /classic.
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

// WebSite structured data so Google can show "Kyle Naranjo" as the site name
// above the title instead of the bare domain.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Kyle Naranjo",
  alternateName: ["Kyle Nathan G. Naranjo", "kylenaranjo.cv"],
  url: "https://kylenaranjo.cv",
};

export default function Home() {
  return (
    <div className={`${fontVars} min-h-screen w-full`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <SitePage kyllm={featureEnabled("kyllm")} />
    </div>
  );
}
