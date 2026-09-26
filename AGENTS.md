<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working in this repo

Next.js 16 app router, React 19, Tailwind v4, deployed on Vercel at kylenaranjo.cv. The live landing page is `app/page.tsx` with its sections in `app/_home/`. `app/samples/` is a design playground for comparing options, not shipped pages. Section visibility lives in `app/flags.ts`; `next dev` shows every section regardless.

## Commands

- `npm run dev`: dev server on :3000. It runs `next dev --webpack` because Turbopack rejects a git worktree's symlinked `node_modules`.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`: run all three before you call a change done.
- `npm run shot`: headless screenshots, below.

## Visual checks

Look at the rendered page before you call a UI change done; reading the source is not enough. `npm run shot` captures routes with headless Chromium into `output/screenshots/` (gitignored), and starts the dev server itself if nothing answers on :3000. Open the PNGs with the Read tool to see them.

- `npm run shot -- / /projects`: the top of each route at desktop (1440x900) and mobile (390x844).
- `npm run shot -- / --tiles --viewport desktop`: the whole page, one PNG per screen. Use this for the tall landing page; a single `--full` PNG downscales until the text is unreadable.
- `npm run shot -- / --selector "#experience"`: one element.
- `--viewport tablet` or `--viewport 1280x800`, `--reduced-motion`, `--base <url>`, `--out <dir>`.

The capture turns off the site's smooth scrolling and hides the Next dev badge. If Chromium is missing, run `./scripts/install-browser.sh`. In cloud sessions the SessionStart hook in `.claude/settings.json` installs it.

## Design rules

- Two font families only: Geist for display and body, Geist Mono for numbers, dates, and metadata. `app/fonts.ts` is the single source.
- No eyebrow labels and no all-caps phrases. Hierarchy comes from size, weight, and the font slots.
- Headings, sub-heads, chips, and UI labels use Title Case ("Get in Touch"). Body copy, questions, and metadata use sentence case.
- Light, warm off-white surfaces with one coral accent (`#F5482D`), used on the live or interactive element and never as a fill.
- Real brand logos from `public/logos/`. Never fabricate screenshots, dashboards, or product mockups of confidential work.
- Build design options as real routes under `app/samples/` so they can be compared rendered, not described in prose.

## Copy rules

- Keep the existing voice: straightforward, slightly formal. Change only the sentence you were asked about; do not rewrite copy around it.
- Do not open a self-introduction with the job title.
- No em dashes in site copy. Use a comma, a colon, or two sentences. Grep strings and JSX text for `—` before you finish. Em dashes in code comments are fine.
- Name the specific technology ("LLM applications", "entity resolution"), not the category ("AI systems"). Prefer terms from the `skills` groups in `app/samples/sampleContent.ts`.
- Never change real metrics, dates, titles, or credentials. Check claims against `app/samples/sampleContent.ts` and `public/Kyle-Naranjo-CV.pdf`.
