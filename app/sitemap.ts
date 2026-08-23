import type { MetadataRoute } from "next";

// /samples/* is the design playground, intentionally left out (robots.ts
// disallows it too).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://kylenaranjo.cv/",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://kylenaranjo.cv/projects",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://kylenaranjo.cv/classic",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
