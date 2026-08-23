import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // design playground, keep the section explorations out of search
        disallow: ["/samples/"],
      },
    ],
    sitemap: "https://kylenaranjo.cv/sitemap.xml",
  };
}
