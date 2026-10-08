import type { Metadata } from "next";
import { Gallery } from "./Gallery";
import s from "../states/states.module.css";

/**
 * /samples/loaders: chevron loader experiments for the data-blocks brand.
 * Design only; every card uses the same verb so the shapes compare on equal terms.
 */
export const metadata: Metadata = { title: "Loaders | Samples", robots: { index: false, follow: false } };

export default function LoadersPage() {
  return (
    <div className={s.root}>
      <main className={s.frame}>
        <header className={s.row}>
          <div className={s.intro}>
            <h1>Loader <em>Designs</em></h1>
            <p>
              Chevron loaders on beautifului.dev&apos;s base, plus three experiments: circular motion,
              packing (how big the cells are and how close they sit), and rounded squares. Each card shows
              the loader large, inline beside a verb, and inside a button.
            </p>
          </div>
        </header>
        <section className={s.row}>
          <Gallery />
        </section>
        <footer className={s.footer}>
          <span>/samples/loaders</span>
          <span>Proposed brand · not live</span>
        </footer>
      </main>
    </div>
  );
}
