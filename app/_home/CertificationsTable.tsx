import { sample } from "../samples/sampleContent";
import styles from "../samples/quiet/styles.module.css";
import home from "./home.module.css";
import { Logo } from "../samples/quiet/Logo";

/**
 * Certifications, landing treatment: a credential registry table on the tinted
 * band. Column heads in mono, rows ditto-grouped by issuer, zero cards. Rows
 * become links (with the ↗ tell) only once a real credential URL replaces the
 * "#" placeholder in sampleContent. The carded variants live on at /samples.
 */

type Cert = (typeof sample.certifications)[number];

function hasUrl(c: Cert) {
  return c.url.startsWith("http");
}

/** Ditto-group: keep data order, but bucket consecutive-by-issuer so the issuer
    cell renders once per group. */
function grouped(): { cert: Cert; issuerCell: boolean }[] {
  const order: string[] = [];
  const byIssuer = new Map<string, Cert[]>();
  for (const c of sample.certifications) {
    if (!byIssuer.has(c.issuer)) { byIssuer.set(c.issuer, []); order.push(c.issuer); }
    byIssuer.get(c.issuer)!.push(c);
  }
  return order.flatMap((issuer) =>
    byIssuer.get(issuer)!.map((cert, i) => ({ cert, issuerCell: i === 0 })),
  );
}

function Row({ cert, issuerCell }: { cert: Cert; issuerCell: boolean }) {
  const inner = (
    <>
      <span className={home.certIssuerCell}>
        {issuerCell ? (
          <>
            {cert.logo ? <Logo name={cert.logo} size={16} /> : null}
            {cert.issuer}
          </>
        ) : null}
      </span>
      <span className={home.certMobileMeta}>
        {cert.issuer} · {cert.issued}{cert.expires ? ` to ${cert.expires}` : ""}
      </span>
      <span className={home.certTitleCell}>{cert.title}</span>
      <span className={home.certDateCell}>{cert.issued}</span>
      <span className={home.certDateCell}>{cert.expires ?? "None"}</span>
      <span className={home.certGo} aria-hidden="true">{hasUrl(cert) ? "↗" : ""}</span>
    </>
  );
  if (hasUrl(cert)) {
    return (
      <a href={cert.url} className={home.certRow} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return <div className={home.certRow}>{inner}</div>;
}

export function CertificationsTable() {
  const rows = grouped();
  const issuers = new Set(sample.certifications.map((c) => c.issuer)).size;
  return (
    <section className={styles.section} aria-label="Certifications">
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.h2}>Certifications</h2>
        <span className={home.secNote}>
          {sample.certifications.length} credentials · {issuers} issuers
        </span>
      </div>
      <div className={home.certTable} role="table" aria-label="Credential registry">
        <div className={`${home.certHeadRow}`} role="row" aria-hidden="true">
          <span>Issuer</span>
          <span>Credential</span>
          <span>Issued</span>
          <span>Expires</span>
          <span />
        </div>
        {rows.map(({ cert, issuerCell }) => (
          <Row key={`${cert.issuer}-${cert.title}`} cert={cert} issuerCell={issuerCell} />
        ))}
      </div>
    </section>
  );
}
