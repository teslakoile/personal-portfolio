"use client";

import { useEffect, useId, useRef, useState } from "react";
import b from "./blocks.module.css";

/**
 * Prototype only: Mermaid loaded from a CDN, themed toward the site, to compare
 * with the hand-drawn SVG diagram. A shipped version would add the package.
 */
export function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"wait" | "ok" | "fail">("wait");
  const id = useId().replace(/[^a-z0-9]/gi, "");

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const url = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
        const { default: mermaid } = await import(/* webpackIgnore: true */ url);
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          themeVariables: {
            fontSize: "12px",
            primaryColor: "#ffffff",
            primaryBorderColor: "#d9d3cc",
            primaryTextColor: "#1c1917",
            lineColor: "#a8a29e",
            clusterBkg: "#faf9f7",
            clusterBorder: "#d9d3cc",
            edgeLabelBackground: "#ffffff",
          },
          flowchart: { curve: "basis", padding: 10, nodeSpacing: 24, rankSpacing: 36 },
        });
        const { svg } = await mermaid.render(`m${id}`, code);
        if (!off && ref.current) { ref.current.innerHTML = svg; setState("ok"); }
      } catch {
        if (!off) setState("fail");
      }
    })();
    return () => { off = true; };
  }, [code, id]);

  return (
    <div className={b.mermaid}>
      <div ref={ref} />
      {state === "wait" ? <span className={b.mermaidWait}>Loading Mermaid...</span> : null}
      {state === "fail" ? <span className={b.mermaidWait}>Mermaid did not load.</span> : null}
    </div>
  );
}
