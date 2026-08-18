import { sample } from "../../sampleContent";
import styles from "../styles.module.css";
import alt from "./Certifications.alt.module.css";
import { Logo } from "../Logo";
import type { SectionVariant } from "./Hero";

type Cert = (typeof sample.certifications)[number];

function datesLabel(c: Cert) {
  return c.expires ? `${c.issued} – ${c.expires}` : `${c.issued} · No expiry`;
}

/** Verified brand logo, or a clean text monogram when none exists (no wrong marks). */
function CertMark({ c, size }: { c: Cert; size: number }) {
  const mono = c.mono; // read before narrowing (all logos are non-empty literals now)
  return c.logo ? <Logo name={c.logo} size={size} /> : <span className={styles.certMono}>{mono}</span>;
}

/** V1 — current: clickable badge grid (logo chip + title + issuer + blurb + dates). */
function CertificationsV1() {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Certifications</h2>
      <div className={styles.certGrid}>
        {sample.certifications.map((c) => (
          <a
            key={`${c.issuer}-${c.title}`}
            href={c.url}
            className={styles.certBadge}
            target={c.url.startsWith("http") ? "_blank" : undefined}
            rel={c.url.startsWith("http") ? "noreferrer" : undefined}
          >
            <span className={styles.certIcon}><CertMark c={c} size={24} /></span>
            <span className={styles.certBody}>
              <span className={styles.certName}>{c.title}</span>
              <span className={styles.certIssuer}>{c.issuer}</span>
              <span className={styles.certBlurb}>{c.blurb}</span>
              <span className={styles.certDates}>
                <span className={styles.certDate}>Issued {c.issued}</span>
                <span className={styles.certDate}>{c.expires ? `Expires ${c.expires}` : "No expiry"}</span>
              </span>
            </span>
            <span className={styles.certArrow} aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/** V2 — grouped by issuer: a logo-forward credential wall showing provider breadth. */
function CertificationsV2() {
  const order: string[] = [];
  const byIssuer = new Map<string, Cert[]>();
  for (const c of sample.certifications) {
    if (!byIssuer.has(c.issuer)) { byIssuer.set(c.issuer, []); order.push(c.issuer); }
    byIssuer.get(c.issuer)!.push(c);
  }
  return (
    <section className={alt.section}>
      <h2 className={styles.h2}>Certifications</h2>
      <div className={alt.groups}>
        {order.map((issuer) => {
          const certs = byIssuer.get(issuer)!;
          return (
            <div key={issuer} className={alt.group}>
              <div className={alt.groupHead}>
                <span className={alt.groupLogo}><CertMark c={certs[0]} size={26} /></span>
                <span className={alt.groupName}>{issuer}</span>
                <span className={alt.groupCount}>{certs.length} credential{certs.length > 1 ? "s" : ""}</span>
              </div>
              {certs.map((c) => (
                <a
                  key={c.title}
                  href={c.url}
                  className={alt.row}
                  target={c.url.startsWith("http") ? "_blank" : undefined}
                  rel={c.url.startsWith("http") ? "noreferrer" : undefined}
                >
                  <span className={alt.rowArrow} aria-hidden="true">↗</span>
                  <span className={alt.rowTop}>
                    <span className={alt.rowTitle}>{c.title}</span>
                    <span className={alt.rowDates}>{datesLabel(c)}</span>
                  </span>
                  <span className={alt.rowBlurb}>{c.blurb}</span>
                </a>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** V3 — big-logo badge wall: a 3-column grid of credential cards, logo up top. */
function CertificationsV3() {
  return (
    <section className={alt.section}>
      <h2 className={styles.h2}>Certifications</h2>
      <div className={alt.grid3}>
        {sample.certifications.map((c) => (
          <a
            key={`${c.issuer}-${c.title}`}
            href={c.url}
            className={alt.badge}
            target={c.url.startsWith("http") ? "_blank" : undefined}
            rel={c.url.startsWith("http") ? "noreferrer" : undefined}
          >
            <span className={alt.badgeArrow} aria-hidden="true">↗</span>
            <span className={alt.badgeLogo}><CertMark c={c} size={30} /></span>
            <span className={alt.badgeName}>{c.title}</span>
            <span className={alt.badgeIssuer}>{c.issuer}</span>
            <span className={alt.badgeBlurb}>{c.blurb}</span>
            <span className={alt.badgeDates}>
              <span>Issued {c.issued}</span>
              <span>{c.expires ? `Expires ${c.expires}` : "No expiry"}</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function Certifications({ variant = 1 }: { variant?: SectionVariant }) {
  if (variant === 2) return <CertificationsV2 />;
  if (variant === 3) return <CertificationsV3 />;
  return <CertificationsV1 />;
}
