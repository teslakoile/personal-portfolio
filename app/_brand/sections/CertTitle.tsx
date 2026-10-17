import x from "./certifications.module.css";
import { bare } from "../format";

/**
 * A certification's title. With a public credential URL it links out in a new
 * tab; without one (LinkedIn lists no credential for it) it stays plain text.
 * Either way it carries the chip hover (ChipFx): the title, then the
 * credential's one-line description, in the site tooltip.
 */
export function CertTitle({ title, gone, url, blurb }: { title: string; gone: boolean; url: string; blurb: string }) {
  const text = bare(blurb);
  const note = { "data-chip": title, "data-note": text, "aria-label": `${title}. ${text}` };
  const cls = `${x.title} ${gone ? x.muted : ""}`;
  if (url.startsWith("http")) {
    return (
      <a className={`${cls} ${x.titleLink}`} href={url} target="_blank" rel="noreferrer" {...note}>
        {title}{"\u00A0"}<span className={x.out} aria-hidden="true">↗</span>
      </a>
    );
  }
  return <span className={cls} tabIndex={0} {...note}>{title}</span>;
}

/** An issuer's name in a group head, linked to its certification program when
    one is known. Same underline-and-arrow hover as a title. */
export function IssuerName({ issuer, url }: { issuer: string; url: string }) {
  if (!url) return <span className={x.issuerName}>{issuer}</span>;
  return (
    <a className={`${x.issuerName} ${x.titleLink}`} href={url} target="_blank" rel="noreferrer">
      {issuer}{"\u00A0"}<span className={x.out} aria-hidden="true">↗</span>
    </a>
  );
}
