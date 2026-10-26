import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Baseline security headers on every route. Vercel already sends HSTS. The
// CSP only restricts framing; a full script policy would have to allow
// Next's inline scripts and the JSON-LD, for little gain on a static site.
// The only browser API the site uses is the clipboard (ContactModal), so the
// rest stay off.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

export default function config(phase: string): NextConfig {
  return {
    turbopack: {
      root: projectRoot,
    },
    async headers() {
      return [{ source: "/:path*", headers: securityHeaders }];
    },
    // the dev-only blog editor uploads images through a Server Action
    // (app/blog/actions.ts); production keeps the 1 MB default
    ...(phase === PHASE_DEVELOPMENT_SERVER
      ? { experimental: { serverActions: { bodySizeLimit: "20mb" } } }
      : {}),
  };
}
