import Link from "next/link";
import type { ReactNode } from "react";
import { BrandRoot, Frame, brand } from "../_brand/kit";
import { sample } from "../samples/sampleContent";
import b from "./blog.module.css";

/**
 * Blog page shell in the redesign's layout (the "Portfolio Redesign"
 * canvas): a sticky 248px rail on the left, then the ruled 1080px frame. The
 * rail carries the wordmark, numbered links, and, on a post, the post's own
 * sections numbered to match the coral numbers beside each h2. Page actions
 * (dev-only New Post and Edit) sit at the rail's foot above Get in Touch.
 * Under 760px the rail collapses to a top bar, as on the canvas.
 */
export function BlogShell({
  active,
  toc,
  actions,
  children,
}: {
  active: "writing" | "post";
  toc?: { id: string; label: string }[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const email = sample.contacts.find((c) => c.href.startsWith("mailto:"))?.href ?? "mailto:kyle.naranjo@gmail.com";
  return (
    <BrandRoot className={b.root}>
      <div className={b.shell}>
        <aside className={`${brand.sidebar} ${b.rail}`}>
          <Link href="/" className={brand.wordmark}>Kyle Naranjo</Link>
          <nav className={`${brand.nav} ${b.railNav}`} aria-label="Site">
            <Link href="/" className={brand.navItem}><span>01</span>Home</Link>
            <Link href="/blog" className={`${brand.navItem} ${brand.navActive}`} aria-current={active === "writing" ? "page" : undefined}>
              <span>02</span>Writing
            </Link>
          </nav>
          {toc?.length ? (
            <>
              <hr className={`${brand.sep} ${b.railNav}`} />
              <p className={`${b.railLabel} ${b.railNav}`}>In This Post</p>
              <nav className={`${b.toc} ${b.railNav}`} aria-label="Sections">
                {toc.map((t, i) => (
                  <a key={t.id} href={`#${t.id}`} className={brand.navItem}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {t.label}
                  </a>
                ))}
              </nav>
            </>
          ) : null}
          <div className={b.railFoot}>
            {actions ? <div className={b.railActions}>{actions}</div> : null}
            <a href={email} className={`${b.btn} ${b.btnAccent}`}>Get in Touch</a>
          </div>
        </aside>
        <main className={b.shellMain}>
          <Frame>{children}</Frame>
        </main>
      </div>
    </BrandRoot>
  );
}
