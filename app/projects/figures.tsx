/**
 * Project imagery — MOCK SCREENSHOT PNGs (per Kyle: raster mocks, not vector
 * art). One greeked app-window shot per slug at public/projects/<slug>.png,
 * 1600×1200 (4:3), generated locally in the site palette with one coral
 * accent each and no text (so no font can leak in through imagery). Replace
 * with real product screenshots at the same paths when they exist — every
 * treatment picks them up automatically.
 */
export function ProjectFigure({ slug }: { slug: string }) {
  return (
    <img
      src={`/projects/${slug}.png`}
      alt=""
      width={800}
      height={600}
      loading="lazy"
    />
  );
}
