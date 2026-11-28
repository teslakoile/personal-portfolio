import type { Metadata } from "next";
import Link from "next/link";
import { featureEnabled } from "../../../flags";
import { SITE_OPTIONS, SitePage, type SiteOption } from "../../../_brand/SitePage";
import o from "./options.module.css";

/**
 * /samples/polished/options: /samples/polished with the open experiments, each
 * switched from the bar (?on=covers,footer; all on with no query, none with
 * ?on=none). They change choices Kyle made before, so each is his to pick;
 * none is on anywhere else.
 */
export const metadata: Metadata = {
  title: "Visual Options | Kyle Naranjo",
  robots: { index: false, follow: false },
};

const LABEL: Record<SiteOption, string> = {
  covers: "Project Covers",
  fallback: "Fallback Covers",
  wide: "Two Across",
  footer: "Dark Footer",
  footermid: "Mid Footer",
};
/* the two footer tones are one choice: turning one on turns the other off */
const RIVAL: Partial<Record<SiteOption, SiteOption>> = { footer: "footermid", footermid: "footer" };
/* the fallback is the earlier set of covers, so it needs covers on */
const NEEDS: Partial<Record<SiteOption, SiteOption>> = { fallback: "covers" };
const ALL: SiteOption[] = ["covers", "wide", "footermid"];

const href = (on: SiteOption[]) => `/samples/polished/options?on=${on.length ? on.join(",") : "none"}`;
const toggle = (on: SiteOption[], x: SiteOption) =>
  on.includes(x)
    ? on.filter((y) => y !== x && NEEDS[y] !== x)
    : SITE_OPTIONS.filter((y) => y === x || y === NEEDS[x] || (on.includes(y) && y !== RIVAL[x]));

export default async function Options({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = (await searchParams).on;
  const asked = q === undefined ? ALL : SITE_OPTIONS.filter((x) => q.split(",").includes(x));
  const on = SITE_OPTIONS.filter((x) => asked.includes(x) || asked.some((y) => NEEDS[y] === x));
  return (
    <>
      <nav className={o.bar} aria-label="Visual options">
        <span className={o.title}>Options</span>
        {SITE_OPTIONS.map((x) => {
          const active = on.includes(x);
          return (
            <Link key={x} className={o.toggle} aria-pressed={active} href={href(toggle(on, x))} scroll={false}>
              {LABEL[x]}
            </Link>
          );
        })}
        <Link className={o.all} href={href(on.length ? [] : ALL)} scroll={false}>
          {on.length ? "All Off" : "All On"}
        </Link>
      </nav>
      <SitePage kyllm={featureEnabled("kyllm")} polish options={on} />
    </>
  );
}
