import Link from "next/link";
import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { FileStackDrag } from "./FileStackDrag";
import { FileStackSpread } from "./FileStackSpread";
import { FileStackRiffle } from "./FileStackRiffle";

/**
 * Optional extra interactions on the Case Files baseline, for the
 * /samples/rework/projects comparison. The tab-hover preview is part of
 * the baseline itself (Projects.tsx → FileStack); each variant here
 * composes ONE more way of handling the same pile:
 *
 *   B  ProjectsFilesDrag, pick the open file up and fling it under
 *   C  ProjectsFilesSpread, lay all six across the desk, pick one back
 *   D  ProjectsFilesRiffle, scrub the tabs, whole files flutter loose
 */

function HeadRow() {
  return (
    <div className={home.pjHeadRow}>
      <h2 className={`${styles.h2} ${home.pjH2}`}>Projects</h2>
      <div className={home.pjHeadMeta}>
        <span className={home.secNote}>
          {String(sample.projects.length).padStart(2, "0")} works · 2022 to Present
        </span>
        <Link href="/projects" className={home.pjAll}>
          See All Projects <span className={home.pjAllArrow} aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

export function ProjectsFilesDrag() {
  return (
    <section className={styles.section} aria-label="Projects">
      <HeadRow />
      <FileStackDrag projects={sample.projects} />
    </section>
  );
}

export function ProjectsFilesSpread() {
  return (
    <section className={styles.section} aria-label="Projects">
      <HeadRow />
      <FileStackSpread projects={sample.projects} />
    </section>
  );
}

export function ProjectsFilesRiffle() {
  return (
    <section className={styles.section} aria-label="Projects">
      <HeadRow />
      <FileStackRiffle projects={sample.projects} />
    </section>
  );
}
