# iPhone UI and UX Audit

Run on 2026-11-14 in the Xcode iOS Simulator: iPhone 17 Pro, iOS 26.5, Safari, 402x874 pt.
Pages: the landing page and `/projects` on a local `next dev` build, plus the KYLLM chat on
kylenaranjo.cv (the local build has no Anthropic key, so it cannot answer).
Screenshots are in this folder. The round "N" button bottom-left in local shots is the Next.js dev badge and is not on the live site.

Severity: **P0** blocks a task, **P1** hides content or breaks a common path, **P2** visible defect or friction, **P3** polish.

## Findings

| # | Sev | Area | What happens on iPhone | Evidence | Cause and fix |
|---|---|---|---|---|---|
| 1 | P0 | KYLLM chat | Focusing the KYLLM text field zooms the whole page. The zoom stays after the keyboard closes: the sheet header and close button scroll off-screen, and answers, the question bubble, and the send button are cut off on the right. Reproduced on kylenaranjo.cv. | [03](03-kyllm-focus-zoom.jpg), [04](04-kyllm-stuck-zoomed-after-blur.jpg), [23](23-prod-answer.jpg) | iOS zooms on any field under 16px. `.input` is 15px at `app/samples/redesign/kyllm-hero/hero.module.css:130`. Set it to 16px on phones. |
| 2 | P0 | KYLLM chat | Tapping the hero question bar opens the sheet and raises the keyboard, and the keyboard covers the text field. You cannot see what you type, and the keyboard also covers most of the answer. | [02](02-kyllm-keyboard-composer-hidden.jpg) | On phones the sheet is `position: fixed; height: 100%` (`hero.module.css:155-158`), and no code reads `window.visualViewport`. Size the sheet to `visualViewport.height` on `resize`, or pin the composer to `visualViewport` bottom. Also skip the auto-focus in `HeroKyllm.tsx:238-240` on touch devices after a question is sent, so the answer stays visible. |
| 3 | P1 | Footer | At the end of the page, the Ask KYLLM pill sits on top of the footer links (LinkedIn, GitHub, CV) and the copyright line. Those links cannot be tapped. | [13](13-dock-covers-footer-links.jpg) | The pill is fixed at `bottom: 20px` (`hero.module.css:72-85`). Add bottom padding to the footer on phones equal to the pill height plus its gap, or hide the pill when the footer is in view. |
| 4 | P1 | Experience | The timeline shows 2022 to 2024 only. The current role (Data Engineer II, Aug 2024 to present) appears as two blocks at the clipped right edge, so it reads as a two-month job. The rest needs a sideways swipe that nothing hints at. | [10b](10b-experience-anchor.jpg) | `.timeline` is `overflow-x: auto` (`app/_brand/brand.module.css:293`). On phones, scroll it to the right end on mount, or shrink the blocks so all years fit, and add an edge fade. |
| 5 | P1 | Hero | "Download CV" replaces the site with Safari's PDF viewer in the same tab. Visitors leave the portfolio and must tap Back. | [17](17-download-cv.jpg) | iOS Safari opened the PDF inline despite the `download` attribute (`app/_brand/kit.tsx:82`). Open it with `target="_blank"`, or label it "View CV" on touch. |
| 6 | P2 | KYLLM, hero | `⌘K` shortcut hints show on the hero question bar, the Ask KYLLM pill, and the chat field. Phones have no ⌘ key. | [01](01-hero.jpg), [21](21-prod-dock-open.jpg) | Hide the hint under `@media (hover: none)` (`HeroKyllm.tsx:314`, `:367`, `KyllmPromo.tsx:50`). |
| 7 | P2 | Dark mode | With iPhone in dark mode, the page stays light but a black band fills the status bar area, and pull-to-bounce shows black above and below the page. | [11](11-dark-mode.jpg) | `app/globals.css:15-20` sets `body` to `#0a0a0a` in dark mode. Paint `html` and `body` with the paper color in both schemes, or set `color-scheme: light`. |
| 8 | P2 | Contact sheet, chips | Hover styles stick after a tap. After you copy the email, a "Copy" tooltip stays on screen indefinitely and sits over the sheet's close button. Rows keep their hover fill after a scroll, and tech chips and calendar cells keep an outline. | [06](06-contact-sticky-copy-tooltip.jpg), [10](10-experience-timeline-clipped.jpg) | iOS keeps `:hover` on the last tapped element. Wrap hover rules in `@media (hover: hover)`, starting with `.copy:hover::after` in `app/_brand/sections/contactModal.module.css`. The copy itself works: the simulator clipboard held the email and then the phone number. |
| 9 | P2 | About | The Currently, Industries, and Speaking On columns are squeezed three across, so most lines hold one or two words. | [09](09-about-three-columns-cramped.jpg) | Stack the three into one column under about 480px. |
| 10 | P2 | Tap targets | Several controls are under Apple's 44 pt minimum: KYLLM close (28 px), KYLLM New Chat (28 px tall), contact close and copy buttons (32 px), and the KYLLM suggestion pills (30 px). | [05](05-contact-sheet.jpg), [21](21-prod-dock-open.jpg) | Keep the drawn size and enlarge the hit area with padding or a `::after` inset, the way `.expand::after` in `footer.module.css:34` already does. |
| 11 | P2 | Photo viewer | The full-screen photo blocks pinch-to-zoom, and it has no visible close button. Tapping anywhere closes it, which nothing on screen says. | [15](15-photo-viewer.jpg), [16](16-photo-viewer-pinch.jpg) | `FooterPhotoView.tsx:82-89` cancels every `touchmove`. Cancel only one-finger moves, and add a close button. |
| 12 | P3 | Reading | The Ask KYLLM pill covers body text and chips in every section while you scroll. | [08](08-content-under-status-bar.jpg), [09](09-about-three-columns-cramped.jpg) | Hide the pill while scrolling down and show it on scroll up, or shrink it to the avatar after the hero. |
| 13 | P3 | Contact sheet | The bottom sheet has no grab handle and does not close on a swipe down, which iOS sheets do. | [05](05-contact-sheet.jpg) | Add a handle and a drag-to-dismiss gesture (Motion `drag="y"`). |
| 14 | P3 | Contact sheet | After you close the sheet with a tap, the hero Get in Touch button shows a coral focus ring. | [07](07-focus-ring-after-close.jpg) | Return focus with `focus({ focusVisible: false })`, or return it only when the sheet was opened from the keyboard. |
| 15 | P3 | Page chrome | Page content scrolls under the clock and Dynamic Island with no backdrop. On the coloured highlight cards, the dark clock sits on top of white text. | [08](08-content-under-status-bar.jpg) | iOS 26 Safari draws page content edge to edge. A sticky header on phones would give the status bar a solid backing. The header is `position: static` under 760px (`app/samples/redesign/redesign.module.css:9-15`). |
| 16 | P3 | Landscape | In landscape, the headline fills the visible area. The header, buttons, and question bar are all below the fold. No horizontal overflow. | [12](12-landscape.jpg) | Reduce the headline size when the viewport is short, for example `@media (max-height: 500px)`. |
| 17 | P3 | KYLLM chat | Once, with the chat field focused, the first tap on a suggestion pill only closed the keyboard, and a second tap sent the question. | [23](23-prod-answer.jpg) | Seen once, not reproduced. Likely the layout moves as the keyboard bar hides. Recheck after fix 2. |

## Checks that passed

- The contact sheet holds the page still: swiping on the backdrop and on the sheet did not scroll the page behind it.
- Copy buttons write to the clipboard: the simulator clipboard held `kyle.naranjo@gmail.com`, then the phone number.
- Tapping a footer photo reveals it and shows the expand button. Expand opens the full-screen view.
- A KYLLM answer streams with the stop button, then shows sources, a copy button, and follow-up pills.
- `/projects` keeps its top bar pinned while scrolling.
- Rotating to landscape and back does not break the layout or cause sideways scrolling.

## Not tested

- Camera, microphone, and file upload: the site has no file input, camera, or microphone use, so there is nothing to exercise. The keyboard's dictation button belongs to iOS.
- The Phone row (`tel:` link): the simulator has no Phone app.
- iOS Text Size and Safari's page zoom setting.
- Smaller phones (iPhone 17e) and a physical device.

## Notes outside the iPhone scope

- `/projects` sets dates, metrics, and tech chips in Geist Mono ([19](19-projects-scrolled.jpg)). AGENTS.md reserves Geist Mono for code identifiers.
- The KYLLM chat field says "Ask KYLLM about my work…" while the empty state above it says "Ask me about Kyle's work".
- The contact sheet pads its bottom with `env(safe-area-inset-bottom)`, but the page has no `viewportFit: "cover"`, so the value is always 0. Nothing looks wrong today because Safari's toolbar sits below the page.

## Fix status

Screenshots after each fix are in `after/`. Desktop (1440), laptop (1280), and tablet (768) tiles of `/` match the pre-fix baseline; `/projects` changes only from the font fix below.

- 1 to 15: fixed and checked in the simulator (10 checked in a headless touch render).
- 16: fixed for short touch screens: headline, subhead, buttons, and question bar fit in landscape; contact links move below the bar.
- 17: did not reproduce. Suggestion pills now keep the field focused through the tap and close the keyboard after sending. Checked in headless Chromium with touch; recheck once on a device.
- Notes: `/projects` dates, metrics, and chips now use Geist with tabular numerals; the KYLLM field placeholder reads "Ask KYLLM about Kyle's work…". `viewportFit: "cover"` is unchanged.
