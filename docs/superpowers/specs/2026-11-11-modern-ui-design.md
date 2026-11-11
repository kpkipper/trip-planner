# Modern UI redesign — design plan

Date: 2026-11-11 · Status: proposal, waiting for the owner's OK · Mockup: [`2026-11-11-modern-ui-mockup.html`](2026-11-11-modern-ui-mockup.html)

## Why

The owner finds the current web UI dated and wants it to feel like fastwork.com: clean, light, roomy, rounded, "modern product" rather than "admin panel".

What makes the current UI look dated:

- **Font:** `body` falls back to Arial (`globals.css`), and Thai text uses whatever the OS has. The Geist/Outfit fonts are loaded but barely used.
- **Colour:** one corporate blue (`#0163a4`, hard-coded 78 times) on a blue-grey background, plus boxed cards with borders everywhere.
- **Layout:** a permanent left sidebar, like a back-office tool. Mobile gets the same sidebar.
- **Density:** small type, tight spacing, few images. A trip page is mostly text in boxes even when it has photos.

## What we take from fastwork.com (style cues only)

Measured on fastwork.com on 2026-11-11:

| Cue | fastwork.com | For Jourly |
|---|---|---|
| Background | warm off-white `#f5f5f3` | same idea: `--bg: #f5f5f3` |
| Text | near-black `#171717`, headings `#2b313b` | same |
| Primary button | dark pill, `#131922`, radius 999px, weight 500 | dark pill for the main action on each screen |
| Headings | large, weight 500, tight letter-spacing (−1px at 46px) | 40–48px hero titles, −0.03em |
| Surfaces | white cards, big radius, soft shadow, photo-first | radius 16–24px, shadow instead of borders |
| Nav | floating glass pill at the top | top pill nav on desktop, bottom tab bar on mobile |
| Profile | cover banner, overlapping avatar, stats row, tabs | profile page and trip header follow this pattern |

**Anti-goal:** do not copy Fastwork's logo, illustrations, fonts ("Fastwork", Google Sans) or copy. Jourly keeps its own name, logo and voice.

## Decisions (my calls — change any of them)

1. **Font: Anuphan** (Google Fonts, Thai + Latin, loopless, weights 400–700). Modern Thai without the "school textbook" loops; free to self-host via `next/font`. Replaces Arial/Geist/Outfit.
2. **Palette:** off-white background, white surfaces, near-black ink, grey secondary text. The blue stays only as an accent (links, focus rings, selected states). Green means "travelling now". Story rings use an orange→pink→violet gradient.
3. **Primary button = dark pill.** Secondary = white pill with a hairline. One primary button per screen.
4. **Navigation:** desktop gets a sticky floating top bar (logo, Feed / My trips / Requests, "+ สร้างทริป", avatar). Mobile gets a bottom tab bar (Feed, Trips, big "+", Requests, Me). The left sidebar goes away.
5. **Trip page:**
   - full-bleed cover hero with the title on top of it and a "กำลังเที่ยว · วันที่ 2 จาก 5" chip;
   - days as pill chips;
   - a **Story row** (round avatars with a gradient ring, opens the new story viewer) above the day's plan;
   - plans as a timeline of rounded cards with a time pill;
   - members and stats in a side card (below the plan on mobile).
6. **Feed:** "now travelling" becomes a story-ring row at the top. Events become photo cards (cover image, overlapping avatar, one line of text).
7. **Profile:** cover banner, overlapping avatar, follow + share buttons, stats (trips / followers / following), tabs Trips · Story.
8. **Forms (create/edit plan, login, settings):** one centred white card, filled grey inputs with large radius, sticky bottom action bar on mobile.
9. **No dark mode** in this round.

## How it gets built

All tokens go into `src/app/globals.css` under `@theme`, so Tailwind classes such as `bg-surface`, `text-ink`, `rounded-card` and `shadow-soft` exist. Small shared components go in `src/components/ui/`: `Button`, `Card`, `Chip`, `Input`, `Tabs`, `StoryRing`, `BottomSheet`. Pages then switch to them one at a time.

| Phase | What changes | Done when |
|---|---|---|
| 1. Foundation | tokens, Anuphan font, `ui/` components, replace the 78 hard-coded hex colours | every page renders with the new font and colours; no layout change yet |
| 2. Shell | top pill nav (desktop), bottom tab bar (mobile), remove sidebar | all routes reachable on both sizes |
| 3. Trip page | hero, day chips, story row, timeline cards, side card | trip view matches the mockup on desktop and mobile |
| 4. Feed + profile | story row, photo cards, profile header and tabs | both match the mockup |
| 5. Forms | create/edit plan, login, settings, invites, follow requests, blocks | same card/input/button style everywhere |
| 6. Polish | empty states, loading skeletons, hover/press motion, focus rings | page-by-page screenshot review, desktop + mobile |

Each phase is one commit (or a few) on a new branch `feature/modern-ui`, cut from `feature/follow-requests`, so it can be reviewed and reverted on its own.

## Checks

- `pnpm test`, `pnpm lint`, `tsc --noEmit`, `pnpm build` after every phase.
- Before/after screenshots of every route at 375px and 1280px.
- Keyboard and screen reader: the focus trap, skip links and labels the current pages have must survive the restyle.
- Thai text: line height for vowels and tone marks (no clipping in pills and chips).

## Open questions for the owner

- Keep the blue as the accent, or pick a new brand colour?
- Is the bottom tab bar on mobile OK (it replaces the hamburger/sidebar)?
- Should trips without a cover photo get a generated gradient cover (as in the mockup) or the first story photo?
