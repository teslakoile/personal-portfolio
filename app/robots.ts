import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // design playground and the hidden brand sheet stay out of search
        disallow: ["/samples/", "/branding"],
      },
    ],
    sitemap: "https://kylenaranjo.cv/sitemap.xml",
  };
}
