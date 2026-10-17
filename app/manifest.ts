import type { MetadataRoute } from "next";

/**
 * Web app manifest, so an "Add to Home Screen" install shows the KYLLM icon
 * (the flat cat on a sky circle, matching the favicon) instead of a screenshot.
 * The maskable variant is a full-bleed sky square with the avatar circle held
 * inside the central 80% safe zone so Android's circle and squircle crops
 * never clip the glasses.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kyle Naranjo",
    short_name: "Kyle Naranjo",
    description: "I build AI agents, data pipelines, and cloud infrastructure.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
