import type { Metadata } from "next";
import { Gallery } from "./Gallery";
import s from "./anim.module.css";

/**
 * /samples/favicon-kyllm-anim: animation options for the KYLLM tab icon (sky
 * circle, D1). Each card plays live at 128 px and at the real 16 css px tab
 * size, and "Try in my tab" drives this tab's actual favicon so the option can
 * be judged in the tab strip. Frames come from
 * scripts/kyllm/favicon_anim_options.py.
 */
export const metadata: Metadata = { title: "Favicon Animations | Samples", robots: { index: false, follow: false } };

export default function FaviconAnimPage() {
  return (
    <div className={s.root}>
      <main className={s.frame}>
        <header className={s.intro}>
          <h1>Favicon Animations</h1>
          <p>Press Try in My Tab, then switch to another tab and watch the tab strip.</p>
        </header>
        <Gallery />
      </main>
    </div>
  );
}
