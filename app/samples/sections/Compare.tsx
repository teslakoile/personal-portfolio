import type { ReactNode } from "react";
import shell from "./_shared.module.css";
import quiet from "../quiet/styles.module.css";

export type VariantEntry = { label: string; note: string; node: ReactNode };

/**
 * Comparison frame for a single section's V1/V2/V3. Each variation is the REAL
 * section component rendered inside the locked Geist token scope (.root +
 * data-variant="swiss"), so V1 is pixel-true to the approved home page and V2/V3
 * share the same design language. minHeight/background are reset inline so each
 * embedded .root doesn't force a 100vh stage.
 */
export function Compare({
  title, hint, recommend, variants,
}: {
  title: string;
  hint: string;
  recommend?: ReactNode;
  variants: VariantEntry[];
}) {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Section variation · pick one</p>
        <h1 className={shell.pageTitle}>{title}</h1>
        <p className={shell.pageHint}>{hint}</p>
        {recommend ? (
          <p className={shell.pageHint} style={{ marginTop: 10 }}>
            <strong style={{ color: "var(--fg)", fontWeight: 600 }}>My pick, </strong>
            {recommend}
          </p>
        ) : null}

        {variants.map((v) => (
          <div key={v.label} className={shell.vblock}>
            <p className={shell.vlabel}>{v.label} · {v.note}</p>
            <div className={shell.vstage}>
              <div className={quiet.root} data-variant="swiss" style={{ minHeight: 0, background: "transparent" }}>
                <div className={quiet.container}>{v.node}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
