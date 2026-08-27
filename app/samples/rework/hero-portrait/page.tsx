import shell from "../../sections/_shared.module.css";
import quiet from "../../quiet/styles.module.css";
import { Hero } from "../../quiet/sections/Hero";

/**
 * Hero portrait treatments, the Franky reference applied to Kyle's own photo.
 *
 * A is what ships today, built by scripts/hero/build.sh. B, C, and D come from
 * scripts/hero/build-duotone.sh: the same four-stage pipeline, printed in a
 * coral ramp off a denser, coarser screen instead of one flat black.
 *
 * The page leads with a true-size row because pitch is the whole decision and
 * it cannot be judged zoomed. The landing page gives the portrait a 262px slot
 * at a 1728px viewport, so the first row renders every option at exactly 262px
 * on the site's paper. The detail row underneath is the same files at 2x, to
 * see what the screen is actually doing. Nothing on the landing page moves
 * until a pick lands.
 */

type Option = {
  label: string;
  src: string;
  ink: string;
  pitch: number;
  plate?: number;
  note: string;
};

/** Cells across, spread over the hero's 262px slot, gives the dot's size on
 *  screen. The halftone options are 2100px plates; G is an 800px one, sized to
 *  its slot because continuous tone does not compress like flat ink. */
const SLOT = 262;
const dotPx = (pitch: number, plate = 2100) => (SLOT / (plate / pitch)).toFixed(1);

const OPTIONS: Option[] = [
  {
    label: "A",
    src: "/hero/portrait-halftone.png",
    ink: "One black",
    pitch: 9,
    note: "Current landing design. The screen is fine enough that the dots fuse at page size, so it reads as a soft grey photo rather than as print.",
  },
  {
    label: "B",
    src: "/hero/portrait-coral-fine.webp",
    ink: "Coral ramp",
    pitch: 14,
    note: "The colour change with the texture kept quiet. His glasses and eyes survive intact, and the dots show up when you lean in.",
  },
  {
    label: "C",
    src: "/hero/portrait-coral.webp",
    ink: "Coral ramp",
    pitch: 20,
    note: "Dots visible without leaning in, and the bridge comes back in the orange it is painted. His glasses start to thin out. Closest we get to the reference without losing the photo.",
  },
  {
    label: "D",
    src: "/hero/portrait-coral-split.webp",
    ink: "Coral scene, black Kyle",
    pitch: 20,
    note: "Two inks split by the subject matte. The bridge carries the accent and his face stays neutral, which is the safest read and the least like the reference.",
  },
  {
    label: "G",
    src: "/hero/portrait-screen.webp",
    ink: "Dot screen over the photo",
    pitch: 15,
    plate: 800,
    note: "The reference's actual effect, measured off it rather than guessed. The photo survives and the dots are only texture, so a screen this coarse costs no detail: his glasses, the jacket seams and the bridge all stay readable where the halftone loses them at half the pitch. Dots land at 4.9px, the reference's own 5. Costs 218 KB against C's 208 KB.",
  },
];

function Plate({ o, width }: { o: Option; width: number }) {
  return (
    <img
      src={o.src}
      alt={`Kyle Naranjo at the Golden Gate Bridge, ${o.ink.toLowerCase()} at pitch ${o.pitch}`}
      width={width}
      style={{ display: "block", width, height: "auto", background: "#faf9f7" }}
    />
  );
}

export default function HeroPortraitRework() {
  return (
    <div className={shell.theme}>
      <div className={shell.pageWrap} style={{ maxWidth: 1560 }}>
        <p className={shell.vlabel}>Hero portrait · pick one</p>
        <h1 className={shell.pageTitle}>Halftone ink and screen</h1>
        <p className={shell.pageHint}>
          Every option is the same photo through the same four stages: tone the
          plate, screen it into dots, weight the dots by region, dissolve the
          edges. What changes is the ink and the pitch. Coral is the site
          accent, <code>#f5482d</code>, and the bridge is already close to that
          colour in life, so the duotone gives the scene back a fact the black
          plate throws away.
        </p>
        <p className={shell.pageHint}>
          Judge on the first row. The landing page gives the portrait a{" "}
          {SLOT}px slot, so a pitch-9 dot lands at {dotPx(9)}px and disappears,
          while pitch 20 lands at {dotPx(20)}px and becomes the texture. Past
          pitch 20 the dots win and his glasses stop resolving.
        </p>
        <p className={shell.pageHint}>
          These are not a copy of the Franky reference, and measuring it says
          they should not be. That page keeps its photograph&rsquo;s own colour:
          its hue varies by 9 to 31 degrees at a fixed lightness, which a
          tone-indexed ramp cannot do, and it reads as one colour only because
          an orange bridge in white fog already is. Kyle&rsquo;s photo is a
          black jacket under a grey sky, so keeping its hue gives a grey
          halftone, and compressing its hue into the same warm band gives a
          muddy mauve one. The ramp below measures 1.3 degrees of hue spread,
          further from the reference and a better picture. H at the foot of the
          page is the other way out: keep the reference&rsquo;s subject as well
          as its filter, and drop the portrait from the hero entirely.
        </p>
        <p className={shell.pageHint} style={{ marginTop: 10 }}>
          <strong style={{ color: "var(--fg)", fontWeight: 600 }}>My pick, </strong>
          C. It is the only option where the effect is legible at the size the
          hero actually renders, and the coral is doing real work: the Golden
          Gate reads as the Golden Gate. Take B instead if you want his face to
          stay as sharp as it is today and the colour to carry the change on its
          own.
        </p>

        <p className={shell.vlabel} style={{ marginTop: 44 }}>
          True size · {SLOT}px, what the landing page shows
        </p>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
          {OPTIONS.map((o) => (
            <div key={o.label} style={{ width: SLOT }}>
              <Plate o={o} width={SLOT} />
              <p className={shell.vlabel} style={{ margin: "12px 0 4px" }}>
                {o.label} · {o.ink}, pitch {o.pitch}
              </p>
              <p className={shell.muted} style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.5 }}>
                {o.note}
              </p>
            </div>
          ))}
        </div>

        <p className={shell.vlabel} style={{ marginTop: 56 }}>
          Detail · the same files at 2x, so the screen is visible
        </p>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
          {OPTIONS.map((o) => (
            <div key={o.label} style={{ width: SLOT * 2 }}>
              <Plate o={o} width={SLOT * 2} />
              <p className={shell.vlabel} style={{ margin: "12px 0 0" }}>
                {o.label} · {o.ink}, pitch {o.pitch}, {dotPx(o.pitch, o.plate)}px per dot at true size
              </p>
            </div>
          ))}
        </div>

        <p className={shell.vlabel} style={{ marginTop: 56 }}>
          H · the reference&rsquo;s subject, its filter fitted numerically
        </p>
        <p className={shell.pageHint} style={{ marginBottom: 16 }}>
          Not your photo at all: a Golden Gate tower generated with{" "}
          <code>gpt-image-2</code>, then put through{" "}
          <code>scripts/hero/franky_filter.py</code>. The filter discards the
          source&rsquo;s colour and paints from a named palette, so the same call
          gives coral, ink, blue or forest from the same photograph, and E below
          is Kyle through the identical call. That filter is not a
          halftone. Measuring the reference turned up a sine screen, a
          subharmonic at 7.54px on the diagonal, which puts light dots on one
          sublattice and dark dots on the other: on a flat coral face it runs
          46.8&thinsp;% of pixels lighter than the median and 46.6&thinsp;%
          darker, which is an ordered dither, not a screen laid over a picture.
          Underneath it there are three inks and no more. Flat 3&times;3 windows
          pile up at L&nbsp;48-62, 146-168 and 250-255 with nothing between, so
          the shadows are a plum rather than a black and the paper is bare.
          Matched: dark rung <code>(132,33,41)</code> against{" "}
          <code>(141,37,37)</code>, dot coverage on a flat face .239 against
          .238. Dots land at 5.0px, the reference&rsquo;s own.
        </p>
        <div className={shell.vstage}>
          <div className={quiet.root} data-variant="swiss" style={{ minHeight: 0, background: "transparent" }}>
            <div className={quiet.container}>
              <Hero variant={4} portrait="/hero/bridge-franky.webp" bleed />
            </div>
          </div>
        </div>

        <p className={shell.vlabel} style={{ marginTop: 56 }}>
          E · the same layout, your own face
        </p>
        <p className={shell.pageHint} style={{ marginBottom: 16 }}>
          On the Franky page the plate is about 580px wide and runs off the
          right and the bottom. That is where its look comes from, not from the
          screen: at that size you get visible dots AND a face that still
          resolves, which a 262px slot cannot give you at any pitch. This is the
          filter as H, pointed at his own plate: four inks at pitch 22, with
          the dark end lifted off the bottom rung so the jacket dithers instead
          of printing as a slab. Colour no longer has to be invented for him,
          it comes from the palette rather than the photograph, which is why
          the same call also produces the coral variant and the icon.
        </p>
        <div className={shell.vstage}>
          <div className={quiet.root} data-variant="swiss" style={{ minHeight: 0, background: "transparent" }}>
            <div className={quiet.container}>
              <Hero variant={4} portrait="/hero/portrait-hero-black.webp" bleed />
            </div>
          </div>
        </div>

        <p className={shell.vlabel} style={{ marginTop: 56 }}>
          In place · the real hero, C
        </p>
        <div className={shell.vstage}>
          <div className={quiet.root} data-variant="swiss" style={{ minHeight: 0, background: "transparent" }}>
            <div className={quiet.container}>
              <Hero variant={4} portrait="/hero/portrait-coral.webp" />
            </div>
          </div>
        </div>
        <p className={shell.pageHint} style={{ marginTop: 12 }}>
          The stage is narrower than the landing column, so the portrait sits
          under its real {SLOT}px here. Read this one for how the coral lands
          next to the headline and the CTA, and the first row for the dots.
        </p>
      </div>
    </div>
  );
}
