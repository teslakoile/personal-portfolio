import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sample } from "../samples/sampleContent";
import { sectionEnabled } from "../flags";
import { fontVariant } from "../fonts";
import styles from "../samples/quiet/styles.module.css";
import prj from "./projects.module.css";
import { ProjectFigure } from "./figures";
import { ContactIcon } from "../samples/quiet/Logo";
import { CONTACT_KIND } from "../samples/quiet/helpers";

export const metadata: Metadata = {
  title: "Projects | Kyle Naranjo",
  description:
    "Selected projects: AI agents, enterprise data pipelines, entity resolution, and research systems built for financial services, education, and compliance.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects | Kyle Naranjo",
    description:
      "Data and AI infrastructure projects: pipelines, agentic AI, record linkage, and research systems.",
    url: "/projects",
    type: "website",
  },
};

/**
 * /projects, the Blueprint Dossier. One monumental column: a full-width
 * drafting-grid plate per project (inline schematic from figures.tsx), then a
 * sticky spec rail beside long-form prose, exact metrics in mono, and links.
 * Landing sheets deep-link here via /projects#<slug>.
 */
export default function ProjectsPage() {
  // rides the projects section flag with the landing section that links here
  if (!sectionEnabled("projects")) notFound();
  return (
    <div className={styles.root} data-variant={fontVariant}>
      <header className={prj.prjTopbar}>
        <div className={`${styles.container} ${prj.prjTopbarInner}`}>
          <Link href="/" className={prj.prjBack}>
            <span className={prj.prjBackArrow} aria-hidden="true">←</span>
            Kyle Naranjo
          </Link>
          <span className={prj.prjCount}>
            {String(sample.projects.length).padStart(2, "0")} projects · 2022 to Present
          </span>
        </div>
      </header>

      <main className={styles.container}>
        <div className={prj.prjHead}>
          <h1 className={prj.prjPageTitle}>Projects</h1>
          <p className={prj.prjLede}>
            The systems behind the résumé lines: enterprise data platforms, agentic AI,
            and the research that started it all. Clients are anonymized; the numbers are exact.
          </p>
        </div>

        {sample.projects.map((p, i) => (
          <article key={p.slug} id={p.slug} className={prj.prjItem}>
            <figure className={prj.prjPlate}>
              <ProjectFigure slug={p.slug} />
            </figure>
            <div className={prj.prjBody}>
              <aside className={prj.prjRail}>
                <div className={prj.prjMetaCluster}>
                  <span className={prj.prjIdx}>{String(i + 1).padStart(2, "0")}</span>
                  <p className={prj.prjMeta}>{p.period}<br />{p.status}</p>
                  <p className={prj.prjClient}>{p.client}</p>
                </div>
                <ul className={prj.prjStack}>
                  {p.stack.map((s) => <li key={s} className={prj.prjChip}>{s}</li>)}
                </ul>
              </aside>
              <div>
                <h2 className={prj.prjName}>{p.title}</h2>
                <div className={prj.prjProse}>
                  {p.summary.map((par) => <p key={par}>{par}</p>)}
                </div>
                {p.metrics.length ? (
                  <dl className={prj.prjMetrics}>
                    {p.metrics.map((m) => (
                      <div key={m.label} className={prj.prjMetric}>
                        <dd className={prj.prjFig}>{m.value}</dd>
                        <dt className={prj.prjCap}>{m.label}</dt>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {p.links.length ? (
                  <div className={prj.prjLinks}>
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} className={prj.prjLink} target="_blank" rel="noreferrer">
                        {l.label} <span className={prj.prjLinkArrow} aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}

        <div className={prj.prjOutro}>
          <p className={prj.prjOutroLine}>Have a data or AI problem worth building for?</p>
          <a href="mailto:kyle.naranjo@gmail.com" className={styles.ctaPrimary}>
            Get in Touch <span className={styles.ctaArrowBox} aria-hidden="true" />
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner} ${prj.prjFInner}`}>
          <span className={styles.footerCopy}>© 2026 Kyle Naranjo</span>
          <div className={styles.footerLinks}>
            {sample.contacts.map((c) => (
              <a key={c.label} href={c.href} className={styles.footerLink}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noreferrer" : undefined}>
                <span className={styles.contactIcon}><ContactIcon kind={CONTACT_KIND[c.label] ?? "email"} size={14} /></span>
                {c.label}
              </a>
            ))}
            <a href={sample.cvUrl} download className={styles.footerLink}>
              <span className={styles.contactIcon} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m7 11 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </span>
              Download CV
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
