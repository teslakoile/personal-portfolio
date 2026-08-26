import type { MetadataRoute } from "next";
import { sectionEnabled } from "./flags";

// /samples/* is the design playground, intentionally left out (robots.ts
// disallows it too). /projects rides the projects section flag: while the
// section is off the route 404s, so it must not be advertised here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://kylenaranjo.cv/",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    ...(sectionEnabled("projects")
      ? [
          {
            url: "https://kylenaranjo.cv/projects",
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.9,
          },
        ]
      : []),
    {
      url: "https://kylenaranjo.cv/classic",
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];
}
