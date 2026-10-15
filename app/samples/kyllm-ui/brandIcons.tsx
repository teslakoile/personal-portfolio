import { Hash } from "lucide-react";

/*
 * Marks for the places KYLLM cites, at source-chip size. Other sites use their
 * own logos from /public/logos (the files the brand kit's chips use). This
 * site's sections need a mark of their own now that the tab icon is KYLLM
 * itself; SiteMark is the open choice: a KN monogram, a section sign, or none.
 */
export type SourceKind = "site" | "github" | "linkedin" | "ieee";
export type SiteMark = "kn" | "hash" | "none";

export function SourceMark({ kind, site = "kn", size = 14 }: { kind: SourceKind; site?: SiteMark; size?: number }) {
  if (kind !== "site") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/logos/${kind}.svg`} width={size} height={size} alt="" style={{ flex: "none", display: "block" }} />;
  }
  if (site === "none") return null;
  if (site === "hash") return <Hash size={size - 1} strokeWidth={2} aria-hidden="true" style={{ flex: "none", color: "var(--coral)" }} />;
  return (
    <span aria-hidden="true" style={{
      flex: "none", display: "inline-grid", placeItems: "center", width: size, height: size, borderRadius: 3,
      background: "var(--ink)", color: "#fff", font: `600 ${Math.round(size * 0.5)}px/1 var(--font-geist), sans-serif`, letterSpacing: "-0.02em",
    }}>KN</span>
  );
}
