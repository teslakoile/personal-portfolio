import Link from "next/link";

// Neutral index for the 3 design-direction samples. Intentionally unstyled-ish
// so it doesn't bias the comparison. View each at /samples/<key>.
const directions = [
  {
    key: "quiet-a",
    name: "Quiet · A, the working home page",
    blurb: "The chosen direction: Geist type system, real multicolor logos, carded experience, certs, image-capable writing cards.",
  },
] as const;

export default function SamplesIndex() {
  return (
    <main
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      className="mx-auto max-w-2xl px-6 py-20 text-stone-800"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Design directions · pick one</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Three rendered samples</h1>
      <p className="mt-3 text-stone-600">
        Same content in each, only the design language differs. Open each, compare, and tell me which to build out
        across the full multi-page site.
      </p>

      <Link
        href="/samples/sections"
        className="mt-8 block rounded-2xl border border-stone-300 bg-stone-50 p-6 transition hover:border-stone-400 hover:shadow-sm"
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-lg font-semibold">Section variations · pick per section</span>
          <span className="font-mono text-xs text-stone-400">/samples/sections →</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Three rendered layout options for each section (Hero, About, Experience, Skills, Writing, Recognition).
          Choose one per section; they compose into the final home page.
        </p>
      </Link>

      <ul className="mt-10 space-y-4">
        {directions.map((d) => (
          <li key={d.key}>
            <Link
              href={`/samples/${d.key}`}
              className="block rounded-2xl border border-stone-200 p-6 transition hover:border-stone-400 hover:shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-lg font-semibold">{d.name}</span>
                <span className="font-mono text-xs text-stone-400">/samples/{d.key} →</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{d.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
