import type { ReactNode } from "react";
import shell from "../../sections/_shared.module.css";
import quiet from "../../quiet/styles.module.css";
import ba from "./before.module.css";
import { Hero } from "../../quiet/sections/Hero";
import { Marquee } from "../../quiet/Marquee";
import { About } from "../../quiet/sections/About";
import { Community } from "../../quiet/sections/Community";

/**
 * Before / after, the fontset trim + label sweep. The "before" column renders
 * the SAME live components with the old presentation re-applied via CSS
 * (eyebrow above the headline, all-caps labels); the "after" column is the
 * site as it ships. Both columns paint in the global Swiss fontset, the trim
 * itself changed zero pixels on the landing, only the network payload.
 */

function Stage({ before, children }: { before?: boolean; children: ReactNode }) {
  return (
    <div className={ba.half}>
      <p className={shell.vlabel}>{before ? "Before" : "After"}</p>
      <div className={shell.vstage}>
        <div className={ba.zoom}>
          <div
            className={`${quiet.root} ${before ? ba.before : ""}`}
            data-variant="swiss"
            style={{ minHeight: 0, background: "transparent" }}
          >
            <div className={quiet.container}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pair({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={shell.vblock}>
      <p className={shell.vlabel}>{title}</p>
      <div className={ba.pair}>
        <Stage before>{children}</Stage>
        <Stage>{children}</Stage>
      </div>
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap}>
        <p className={shell.vlabel}>Before / after · font trim + label sweep</p>
        <h1 className={shell.pageTitle}>What actually changed</h1>
        <p className={shell.pageHint}>
          Left is how the site looked before the sweep; right is how it ships
          now. Same components, same data, the before column just re-applies
          the old eyebrow and all-caps styling.
        </p>

        <div className={shell.vblock}>
          <p className={shell.vlabel}>Font payload · every page</p>
          <div className={ba.pair}>
            <div className={ba.half}>
              <p className={shell.vlabel}>Before</p>
              <div className={`${shell.vstage} ${ba.stats}`}>
                <span className={ba.statBig}>9 families · 13 files · 434 KB</span>
                <span className={ba.statSub}>
                  Geist, Geist Mono, Fraunces, Spline Sans, Inter, Source Serif 4,
                  Space Grotesk, JetBrains Mono, IBM Plex Mono, all preloaded,
                  two actually painted.
                </span>
              </div>
            </div>
            <div className={ba.half}>
              <p className={shell.vlabel}>After</p>
              <div className={`${shell.vstage} ${ba.stats}`}>
                <span className={ba.statBig}>2 families · 4 files · 52 KB</span>
                <span className={ba.statSub}>
                  Geist + Geist Mono, the global fontset (app/fonts.ts), aliased
                  across /samples and /classic too. Identical rendering, 88%
                  smaller.
                </span>
              </div>
            </div>
          </div>
        </div>

        <Pair title="Hero + ticker, eyebrow removed, label de-capped">
          <>
            <Hero variant={4} />
            <Marquee />
          </>
        </Pair>

        <Pair title="About, glance labels de-capped">
          <About variant={3} />
        </Pair>

        <Pair title="Community, KPI captions + sub-head de-capped">
          <Community />
        </Pair>
      </div>
    </div>
  );
}
