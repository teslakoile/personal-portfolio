import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default function config(phase: string): NextConfig {
  return {
    turbopack: {
      root: projectRoot,
    },
    // the dev-only blog editor uploads images through a Server Action
    // (app/blog/actions.ts); production keeps the 1 MB default
    ...(phase === PHASE_DEVELOPMENT_SERVER
      ? { experimental: { serverActions: { bodySizeLimit: "20mb" } } }
      : {}),
  };
}
