import Link from "next/link";
import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { FileStack } from "./FileStack";

/**
 * Projects — the Case Files pile, Kyle's chosen baseline for the flagship
 * section (labeled dossier tabs + screenshot peeks; see FileStack.tsx for
 * the island). Interaction variants are explored at /samples/rework/projects;
 * this stays the landing composition until a different pick lands.
 */
// The landing pile previews the top of the drawer only; the full set lives
// at /projects (dedicated UI for that page still to come).
const PREVIEW_COUNT = 4;

export function Projects() {
  return (
    <section className={styles.section} aria-label="Projects">
      <div className={home.pjHeadRow}>
        <h2 className={`${styles.h2} ${home.pjH2}`}>Projects</h2>
        <div className={home.pjHeadMeta}>
          <span className={home.secNote}>
            {String(sample.projects.length).padStart(2, "0")} works · 2022 – Present
          </span>
          <Link href="/projects" className={home.pjAll}>
            See All Projects <span className={home.pjAllArrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <FileStack projects={sample.projects.slice(0, PREVIEW_COUNT)} />
    </section>
  );
}
