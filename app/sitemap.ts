import type { MetadataRoute } from "next";
import { sectionEnabled } from "./flags";
import { getAllPosts } from "./blog/lib/posts";

// /samples/* is the design playground, intentionally left out (robots.ts
// disallows it too). /projects rides the projects section flag: while the
// section is off the route 404s, so it must not be advertised here. /blog
// 404s until a post is published, and lists published posts only. /classic
// is the archived original landing page; it inherits the root canonical ("/"),
// so it stays out too rather than advertise a URL that points elsewhere.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts({ includeDrafts: false });
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
    ...(posts.length
      ? [
          {
            url: "https://kylenaranjo.cv/blog",
            lastModified: new Date(posts[0].updatedAt),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
          ...posts.map((p) => ({
            url: `https://kylenaranjo.cv/blog/${p.slug}`,
            lastModified: new Date(p.updatedAt),
            changeFrequency: "monthly" as const,
            priority: 0.7,
          })),
        ]
      : []),
  ];
}
