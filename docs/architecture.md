# Unspoken architecture

The contract for everyone building on this repo. Read it before adding an app, a screen, a style or an endpoint. The code is the source of truth for values; this document says where things live and the rules for using them.

## Principles

- **One game, two platforms.** Android (Expo, `apps/mobile`) and web (Next.js, `apps/web`) render the same screens from the same packages. Platform code draws pixels and handles input; it never decides rules, wording or colors.
- **Logic is portable.** Rules, dealing and round state live in `@unspoken/core`: pure TypeScript with no React, platform or network APIs. The same code runs in the apps and in the service (`services/api`).
- **Nothing hard-coded.** Rules are in `gameConfig`, strings in the copy catalog, colors and sizes in design tokens, and URLs and ids in env. A screen that types a color, a size from the boards, a user-facing string or a URL is a bug.
- **Swap, don't recode.** A layout style, color or mode (light or dark) is a data change. Screens are built from a fixed set of slot components that read the active theme.
- **Small and modern.** Few dependencies, TypeScript source shared directly (no build step for packages), tests through public interfaces only.

## Repository layout

```
apps/mobile            Expo app (SDK 57): Android, plus a web export for previews
packages/core          @unspoken/core: game domain
packages/content       @unspoken/content: word bank and English copy
packages/design-tokens @unspoken/design-tokens: palettes, type, sizes, motion, layout styles, theme helpers
packages/api-contract  @unspoken/api-contract: HTTP paths, zod schemas, typed client
apps/web               (next) Next.js site
services/api           @unspoken/api: Hono service implementing api-contract, on Railway with Postgres (see its README)
```

pnpm workspace (`pnpm-workspace.yaml` covers `apps/*`, `packages/*`, `services/*`) with `node-linker=hoisted` for React Native. Packages are `"type": "module"`, export `./src/index.ts`, and extend `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`). Metro compiles them as source. Next.js must list them in `transpilePackages`. A service can run them with a TypeScript-aware runner (tsx, Bun) or bundle them.

Root scripts run across every workspace: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check` (all three). Each package has `lint`, `typecheck` and `test` scripts. A new package adds the same three.

## Packages

### @unspoken/core

| Area | Exports | Notes |
| --- | --- | --- |
| Catalog ids | `DIFFICULTY_IDS`, `CATEGORY_IDS`, `MODE_IDS`, `FEEDBACK_TOPIC_IDS`, `FEEDBACK_ENTRY_POINTS`, `FEEDBACK_PLATFORMS`, `CLOCK_KINDS`, `PLAY_KINDS` and their types | Ids are stable keys for config, copy and the API. Display text never lives here. |
| Config | `gameConfig: GameConfig` | Every tunable rule: per-difficulty round length, banned count and Hot potato range; per-mode clock, scoring, skip limit, bonus seconds, Escalate and pass rules, availability (Teams is coming soon, there is no Zen); defaults (Endless, Expert 1, All cards, 3 skips); skip options; timer limits; Escalate, Hot potato, Reverse and Mind Reader numbers. JSON-serializable, so `GET /v1/config` can serve it. Every function that reads rules takes an optional `config` argument. |
| Rules | `modeRules`, `defaultRoundSeconds`, `bannedCountFor`, `hasTimerSetting`, `hasSkipSetting`, `hotPotatoRange`, `hiddenRoundSeconds`, `escalateProgress`, `withDifficulty`, `defaultSettings`, `canStart` | |
| Cards | `normalizeBank`, `cardsFor`, `deckSize`, `categoriesInBank`, `playableCards`, `dealFromBank`, `dealDeck`, `seededRandom`, `newSeed` | All cards leaves out cards flagged out of All cards and deals by weight (key `random^(1/weight)`); chosen themes deal evenly. Escalate plays only 10-banned-word cards when at least 20 exist. `dealFromBank` is what `POST /v1/decks` runs; the same seed always deals the same deck. |
| Rounds | `createRound(settings, { cards, seed, showIntro?, config? })`, `roundReducer(state, action)` | One reducer for every mode, made for a single `useReducer`. State is plain data (the PRNG state is a number in it), so rounds can be saved, replayed or synced later for multiplayer. Swipe modes: actions `correct`, `skip`, `tick`, `pause`, `resume`, `ready`; selectors `swipeCard`, `canAnswer`, `skipsLeft`, `bannedShown`, `clockProgress`, `isClockRunning`, `isSwipeOver`, `isSwipeWon`, `swipeEscalate`. Reverse: `start`, `revealClue`, `togglePeek`, `showAnswer`, `got`, `missed`; `reverseCard`. Mind Reader: `start`, `predict`, `handOff`, `takeOver`, `finishClues`, `nextWord`; `mindReaderCard`, `filledPredictions`, `predictionsNeeded`. |
| Status lines | `roundSubline`, `menuStatus`, `clockLabel`, `pausedStatus`, `swipeSummary`, `categoriesLabel` | Decide which message applies and fill it from a catalog that satisfies `RoundCopy`. |
| Text | `format`, `plural`, `count`, `formatClock`, timer-input helpers (`sanitizeTimerDigits`, `timerDigitsToSeconds`, `secondsToTimerDigits`, `timerDigitsLabel`), `wordShape` | `{name}` placeholders; `Plural = { one, other }`. |
| Fitting | `fitWordSize(text, metrics, { width, max, min, maxLines })`, `linesAt`, `blankCellSize` | Picks the largest font size at which a word fits its box without breaking inside a word, from glyph widths, so every platform and the server agree without measuring. Pass `wordMetrics` from design tokens and the style's `word.size` / `word.minSize` / `word.maxLines`. |
| Feedback | `feedbackRules` (500 characters; topic preselected per entry point: Customize → Styles and colors, Modes → Game modes, game menu → Something else), `defaultFeedbackTopic`, `feedbackLength`, `canSendFeedback` | Length counts what the player sees: trimmed, one per emoji. |

Time and randomness are injected. Rounds take a `seed` (apps use `newSeed()`, tests use fixed numbers) and advance their clock only through `tick` actions. Platforms run a 1-second interval while `isClockRunning(state)` and dispatch `{ type: 'tick', seconds: 1 }`.

### @unspoken/content

- `bank`: the normalized word bank (`data/word-banks.json`, 5,017 cards, 10 banned words each, unique ids). Add cards in the JSON. Apps import it for offline play. The service imports it to deal.
- `en`: every user-facing string, keyed by core and design-token ids, with `{placeholder}` slots. `roundCopy` is the same object typed as `RoundCopy`. `CopyCatalog` is its type: a new locale is a copy of `en.ts` typed as `CopyCatalog`, plus a locale switch where the apps read `en`.
- Known data issue: two words appear twice in accented and plain spellings at different levels (Smörgåsbord / Smorgasbord, Ragnarök / Ragnarok). Ids stay unique (the second gets its difficulty appended), but the content owner should choose one spelling each.

### @unspoken/design-tokens

- **Palettes** (`palettes`, `COLOR_IDS`): teal (default), clay, lilac, sage, mustard, slate blue and rose, each in `light` and `dark` (dark is "Ink and stone": near-black neutral base, deep muted accent). Each has the same semantic roles (`ColorRoles`: canvas, bg, surface, surfaceRaised, ink, muted, accent, onAccent, onAccentStrong, onAccentMuted, accentText, accentVivid, accentTint, accentShade, outline, rule, track, barIdle, barSkip, panel, onPanel, onPanelMuted, deep, onDeep, onDeepMuted, deepOutline, deepAccent, onDeepAccent, scrim, and a six-band `ramp` for Ombre), plus a `swatch` for Customize. The dark accent tones (accentVivid, accentTint, accentShade, the deep roles) equal an existing light role in light (accentText, surface, surface, panel and its family), so they only change dark. Colors are `#RRGGBB` or `#RRGGBBAA`, which CSS and React Native both accept.
- **Region tones** (`REGION_TONES`, `regionColors`): canvas, base, surface, raised, accent, panel, deep (a deep accent panel: the Ombre footer in dark) and shade (a dark accent fill: the Chips Skip bar in dark). A region is a block of screen with its own background. It resolves to `RegionColors` (bg, ink, muted, accentText, accent, onAccent, chip, chipInk, tint, rule, outline, track, progress, vivid). `tint` is an accent-tinted chip and `vivid` a brighter accent for big numerals; slots use them only when their config asks (`banned.chipFill: 'tint'`, `timer.vivid`). Slot components read the colors of the region they sit in, never palette roles, so one component works on the page, on Sheet's accent top and in Ink's dark panel.
- **Type**: `fonts` (Manrope 400 to 800; `fonts.native[weight]` names the per-weight family registered by `@expo-google-fonts/manrope`; `fonts.webStack` for CSS), `textStyles` (sizes measured from the boards; line height and letter spacing are relative to the size), `wordMetrics` (Manrope ExtraBold advance widths for `fitWordSize`).
- **Scales**: `space`, `radius`, `elevation` (light and dark box shadows), `motion` (swipe threshold and fly-out, card enter spring, swipe hint, spotlight timing), `breakpoints`, `maxWidth`, `layout` (measured constants: `screen` padding for full-page screens and overlays, `play` margins for the play screen, touch target, the Card tile and ring, the Deck card, chips, compact banned lists, short screens, sheets, buttons, grid columns, thumbnail scale, swatches), `spotlight` (How to play overlay).
- **Layout styles** (`layoutStyles`, `STYLE_IDS` in Customize order: Card (default), Deck, Lines, Split, Ledger, Ink, Bottom, Sheet, Big timer, Chips, Ombre). A style may carry `margins` (top or bottom that differ from `layout.play`) and `dark` (slot changes merged in for dark mode). `layoutStyleFor(id, mode)` returns the style as drawn in a mode, `playMargins(style)` its play screen margins, `ringCardSize(width, height)` the Card ring for a space. See below.
- **Theme helpers**: `resolveTheme({ style, color, mode })` returns a `Theme`: the style for the mode (`layoutStyleFor`), the effective color (a pinned style overrides the player's pick), the palette roles, every region tone resolved, and shadows. `parseThemeSelection(stored)` reads a saved selection and defaults bad fields. `nativeTextStyle(name, size?)` gives React Native text props. `cssVariables(theme)` and `cssText(theme, selector)` give CSS custom properties (`--un-color-surface-raised`, `--un-ramp-1-bg`, `--un-panel-ink`, `--un-shadow-card`, `--un-space-4`, `--un-radius-card`, `--un-text-word-size`, `--un-font`).
- **Contrast**: `test/contrast.test.ts` checks every text slot on its background, in every region tone, palette and mode, against WCAG AA (4.5:1), along with Ombre bands, spotlight captions and the Play label. When you change a color, shade the same hue until the test passes.

### @unspoken/api-contract

- `paths`: `/v1/config` (GET, the `GameConfig`), `/v1/decks` (POST `{ difficulty, categories = [], mode?, count?, seed? }` returns `{ seed, total, cards }`), `/v1/feedback` (POST `{ topic, message, entryPoint?, platform?, appVersion? }` returns `{ id, receivedAt }`). Every path is versioned. A breaking change ships as `/v2` beside `/v1`. Multiplayer will add `/v1/rooms`.
- Schemas (zod 4), built from core ids and rules so they cannot drift: `gameConfigSchema`, `dealRequestSchema`, `dealtDeckSchema`, `feedbackRequestSchema` (trims the message and applies `canSendFeedback`), `feedbackReceiptSchema`, `apiErrorSchema` (`{ error: { code, message, issues? } }`), `apiErrorStatus` (each code with its HTTP status: `invalid_request` 400, `not_found` 404, `payload_too_large` 413, `rate_limited` 429, `internal` 500, `unavailable` 503), `issuesOf` (zod issues in the error body's shape), `clientConfigSchema`. The service validates requests with the same schemas.
- `createApiClient({ baseUrl, fetch? })` returns `getConfig()`, `dealDeck(request)` and `sendFeedback(request)`. It validates requests before sending and responses before returning. Every failure is an `ApiError` with `status` (0 when nothing came back), `code` and `issues`.

## Rendering: slots and variants

The play screen is assembled, not drawn per style. Each platform implements these once:

| Slot | Variants (`styles.ts`) | Reads |
| --- | --- | --- |
| Frame (`arrangement`) | `ringCard` (Card), `floatingCard` (Deck), `stack`, `lowerPanel` (Split, Ink, Bottom), `sheet` (Sheet); `panel` size `fill` or `content` (Bottom wraps its list) | `style.regions` for which tone each block uses |
| Header | `titleBadge`, `pill`, `caps`, `inline`; position `top` or `aboveWord`; container; menu `dots` or `sliders` | core `roundSubline`, copy `modes` and `difficulties` |
| Timer | `ring`, `bar` (placement, thickness, bleed, clock position), `bigClock`, `chip`, `dial` | `clockProgress`, `clockLabel`, `isClockRunning` |
| Stats | placement `subline`, `header`, `belowHeader`, `aboveWord`, `underWord`, `footer`; emphasis `plain`, `bigNumber`, `pill` | round state, copy `units` |
| Word | container `tile`, `card`, `none`; label; size, minSize, maxLines; color | `fitWordSize` with `wordMetrics` |
| Banned list | `chips`, `table`, `tileGrid`, `rows`, `numberedRows`, `columns`, `dashedColumns`, `bands` | `bannedShown`, copy `play.dontSay`; compact sizes from `layout.banned.compactFrom` words or on short screens |
| Controls | `swipeLinks` (bars or text hint), `pills`, `buttons`, `splitBar`; skip look; ratio or fixed width | `canAnswer`, swipe `motion` |

A slot component takes its slot config plus the `RegionColors` of the region it sits in. It looks up nothing else about the style. Adding a style means adding an entry to `layoutStyles` (and its name to `en.customize.styles`). A new variant is added to the slot's union type, then implemented on each platform.

**Margins.** Every style uses `playMargins(style)`: `layout.play` (32 at the sides, 30 at the top, 38 under the last row of controls) unless the style overrides top or bottom (Sheet 44 and 22; Split and Chips 0 at the bottom, their bars reach the edge). Panels, sheets, bands, bleeding timer lines and split bars run edge to edge by bleeding out by the side margin; their content is inset by it. Full-page screens and overlays keep `layout.screen`.

**Dark mode.** A style's `dark` entry changes slots in dark (Chips, Big timer, Ombre). Always take the style from `theme.style` or `layoutStyleFor(id, mode)`, never `layoutStyles[id]`, when drawing.

Split always uses sage and Sheet always uses clay (`color: { kind: 'pinned' }`). Customize still lets the player pick a color for the other styles and shows `customize.pinnedColor` while a pinned style is selected. Light and dark always apply.

**Platform wiring.** React Native: hold the `ThemeSelection` in a context, `resolveTheme` it, and pass region colors down. Web: `resolveTheme`, then write `cssText(theme, ':root')` (or a `[data-theme]` selector) into the page and have components use the variables. Next.js can render this on the server from a cookie so the first paint is themed. Both persist `ThemeSelection` (AsyncStorage or localStorage) and read it back with `parseThemeSelection`.

**Thumbnails.** Customize shows each style as the real play screen rendered at `layout.thumbnail.scale` (0.235 of the 390 × 844 reference) with sample content, in the style's `thumbnailColor` and the current mode. They are not separate drawings.

## Design update 2026-10-16: Ink and stone dark mode and margins

Approved on the canvas ("Styles · dark mode (Ink and stone)" and the light Style boards). The tokens carry it; each app must make these changes. Mobile files are under `apps/mobile/src/play`, web files under `apps/web/src`.

| Fix | Tokens | Mobile | Web |
| --- | --- | --- | --- |
| Dark palettes | New `dark` values for all 7 colors; new roles, tones and slots above | Nothing beyond the rows below | Nothing: `/theme.css` picks up roles, tones (`[data-region="deep"]`, `"shade"`) and slots (`--region-tint`, `--region-vivid`) |
| Dark style changes reach the screen | `layoutStyleFor(id, mode)`; `resolveTheme` already uses it | Draw from `theme.style` (already) | `screens/PlayScreen.tsx` and `components/customize/StyleThumbnail.tsx`: replace `layoutStyles[id]` with `layoutStyleFor(id, mode)` |
| Margins | `layout.play`, `style.margins`, `playMargins(style)` | `PlayView.tsx`: `PAD`, the top padding in `Top` and `PanelFrame`, and the footer's bottom padding come from `playMargins(theme.style)` (keep the short-screen reduction); every bleed (`Middle`, `TimerBar`, bands in `Banned`) uses the same side margin | `components/play/PlayFrame.module.css`: `--pad-x`, `--pad-top`, `--pad-bottom` (frame and `.preview`) from `playMargins(layoutStyle)` instead of `--un-layout-screen-*` (set them inline, or use `--un-layout-play-*` plus per-style overrides); `Timer.module.css` `.bleed` and `BannedList.module.css` bands bleed by `--pad-x`; the fallback widths in `BannedList.tsx` and `FittedText.tsx` use `layout.play.paddingX` |
| Card ring fits the margins | `ringCardSize(width, height)` (326 × 540 on the reference screen) | `RingCardFrame`: size the ring with `ringCardSize(box.w, box.h)` instead of two independent `Math.min`s | `PlayFrame.tsx` ring card: size `.swipeCard` with `ringCardSize` (or `aspect-ratio` from `layout.card` with the same caps) so the height scales with the width |
| Card timer label has no box | Card `timer.fill: 'none'` | `slots/Timer.tsx` `RingClock`: no `backgroundColor` when the slot's `fill` is `'none'` (pass the slot in) | Already unboxed (`.ringClock` has no background); keep it so and honor `fill: 'none'` |
| Split and Chips bars | `controls.height` 110, `controls.paddingBottom` 14, `margins.paddingBottom` 0 | `slots/Controls.tsx` `SplitBar`: each half's bottom padding is `slot.paddingBottom + bottomInset` | `components/play/Controls`: split bar halves get `padding-bottom: slot.paddingBottom` plus the safe area |
| Bottom Skip pill | Bottom `controls.skip: 'pillIcon'`, `skipWidth` 116 (height 64 as Correct) | `slots/Controls.tsx` `Pills`: an outlined pill (`colors.outline`, `layout.stroke.outline`, radius pill), `skipWidth` × `slot.height`, with the arrow icon (`layout.icon.lg`) and "Skip" (button text) inside; no label below. Then drop the `roundIcon` branch | `components/play/Controls.tsx`: the same pill for `skip === 'pillIcon'` (replace the `roundIcon` markup) |
| Sheet runs full width | Same side margin as everything else | The sheet stays a full-width view; its content padding is the side margin | `.lowerWrap` keeps bleeding by `--pad-x`, which must be the play side margin |
| Sheet header pure white in dark | `accent` tone `ink` is `onAccentStrong` (`#FFFFFF` in dark) | Nothing: header and word read the accent region's `ink` | Nothing: `--region-ink` |
| Ombre dark footer | Ombre `dark.regions.controls: 'deep'` (deep accent bg, onDeep text, deepOutline Skip border, deepAccent Correct with onDeepAccent text) | Nothing: `Footer` reads `theme.style.regions.controls` | Nothing once the style comes from `layoutStyleFor` (`data-region="deep"`) |
| Chips dark accents | Chips `dark`: `regions.correct: 'accent'`, `regions.skip: 'shade'`, `timer.fill: 'accent'`, `banned.chipFill: 'tint'`, `banned.labelColor: 'accentText'`; the bar above the controls is already `progress` (accent) | Correct and Skip halves: nothing (`halvesFor`). `TimerChip`: `fill: 'accent'` is `colors.accent` with `colors.onAccent` text and pause icon. `Banned`: chips use `colors.tint` when `chipFill` is `'tint'`; the DON'T SAY label uses `colors.accentText` when `labelColor` is `'accentText'` (default `colors.muted`) | Halves: nothing once the style comes from `layoutStyleFor`. `Timer.module.css`: a `.fill-accent` rule (`--region-accent` / `--region-on-accent`). `BannedList`: `--region-tint` for `chipFill: 'tint'`, `--region-accent-text` label for `labelColor: 'accentText'` |
| Big timer dark accents | Big timer `dark.timer.vivid: true`; region `vivid` is accentVivid (hsl(h, 50%, 62%), sage 24%) | `BigClock` digits and the clock's `TimerBar` progress use `colors.vivid` when `slot.vivid` | `.bigRow` color and the bar `.fill` use `--region-vivid` when `slot.vivid` |

## Screens

Wording comes from `en`; numbers come from `gameConfig` and `layout`.

| Screen | Contents | Copy | Notes |
| --- | --- | --- | --- |
| Play | Any of the 11 styles. Swipe right for Correct and left for Skip, or use the controls. The header opens the mode and difficulty sheet (pill styles) or the difficulty picker (Card badge); the menu button opens the game menu. Overlays: Paused, Pass the phone (Hot potato), round over. | `play`, `paused`, `pass`, `over`, `status`, `a11y` | Reverse and Mind Reader keep their own card screens (`reverse`, `mindReader`) and use the same header, menu and theme. |
| Game menu sheet | "Game paused" with the status line: Restart game, Change settings, Customize, Send feedback, How to play, Resume | `menu` | `menuStatus` for the line |
| Mode and difficulty sheet | Difficulty grid (`layout.grid.sheetDifficulty` columns, cards per level), Restart (same mode and level), New game (to Modes), Keep playing | `modeSheet` | Picking a difficulty starts a new round |
| Modes | ‹ Back, 2-column grid in `MODE_IDS` order (Teams shows Coming soon), then the "Want another mode?" card, which opens Send feedback from `modes` | `modesScreen`, `modes` | |
| New game setup | Difficulty, themes (multi-select or All cards; warns below `smallDeckCards`), round timer (microwave input, default per level, only for visible clocks), skips (only for modes with a skip limit) | `setup` | `withDifficulty`, `canStart` |
| Customize page 1 | ‹ Back, Done; style grid of 3 × 2 thumbnails (Card through Ink), "Swipe for more →"; 7 color swatches; Light / Dark | `customize` | |
| Customize page 2 | Bottom, Sheet, Big timer, Chips, Ombre and a dashed "Want another style?" tile, which opens Send feedback from `customize`; "← Swipe back" | `customize` | |
| Send feedback | "‹ {place}" back link; topic chips (Styles and colors, Game modes, Words and cards, Something else) with the entry point's topic preselected and the "Picked for you" note; a 500-character box with an `n / 500` counter; Send (disabled until `canSendFeedback`) | `feedback` | `sendFeedback` with `entryPoint`, `platform` and `appVersion`; on failure show `feedback.failed` and keep the text |
| Thanks | Title, body, Done (back to where feedback was opened) | `thanks` | |
| How to play | The play screen under the dark spotlight: 7 steps of 3 s (`motion.spotlight`), with the cut-out gliding between targets (`word`, `banned`, `difficulty`, `menu`, `play`), white captions, step dots, Skip tour, and a white Play button with the accent label that pulses on the last step | `howToPlay` | `spotlight` tokens are fixed across styles and modes. Each style maps the five targets to its own slots. |

## Responsive rules

- Design at the 390 × 844 reference. Below `breakpoints.medium` (600) a screen is a phone column.
- The game column never grows past `maxWidth.column` (480). Wider windows center it and fill the sides with the page background (bg, or canvas on full-page screens). Sheets cap at `maxWidth.sheet`, full-page forms at `maxWidth.page`, paragraphs at `maxWidth.prose`.
- From `medium` up, keep the column and add space around it. Do not stretch the card or the controls. From `expanded` (1024), web may show Customize thumbnails or Modes with more columns, but play stays one column.
- Words never overflow. Size every word, banned list and tile label with `fitWordSize` against the actual box width, using the style's limits. Phrases wrap to `maxLines` before they shrink, and break after hyphens.
- Banned lists switch to compact chip and row sizes from `layout.banned.compactFrom` words, which matters for Escalate's ten.
- The header and controls always stay on screen; the space between them flexes and scrolls only as a last resort. Windows shorter than `layout.shortScreen.height` (small phones) scale the word's largest size by `layout.shortScreen.wordScale` and use the compact banned list.
- Touch targets are at least `layout.minTouch` (44). Respect safe areas on native and `env(safe-area-inset-*)` on web.
- Honor reduced motion: skip the swipe hint and spotlight glide, and use fades.

## Config and environment

Rules, copy and tokens are data in the packages. Deployment-specific values come from env and are validated once at startup with `clientConfigSchema`. They are never written into source.

| Value | Expo (`apps/mobile`) | Next.js (`apps/web`) | Service (`services/api`) |
| --- | --- | --- | --- |
| API base URL | `EXPO_PUBLIC_API_URL` | `NEXT_PUBLIC_API_URL` | `PORT`, `CORS_ORIGINS` |
| Google Analytics id | `EXPO_PUBLIC_GA_MEASUREMENT_ID` | `NEXT_PUBLIC_GA_ID` | |
| Database | | | `DATABASE_URL` (Railway's Postgres, as `${{Postgres.DATABASE_URL}}`) |
| Limits | | | `TRUST_PROXY_HOPS`, `BODY_LIMIT_BYTES`, `FEEDBACK_RATE_LIMIT`, `FEEDBACK_RATE_WINDOW_SECONDS` |
| App version | `app.json` version (read with `expo-constants`) | `package.json` version at build | |

- Expo inlines only literal `process.env.EXPO_PUBLIC_*` reads, and Next only `process.env.NEXT_PUBLIC_*`. Read each variable by its full name in one config module per app and pass the values to `clientConfigSchema.parse`. Locally use `.env.local` files (gitignored), with a committed `.env.example` that lists the names. For builds use EAS environment variables or `eas.json` profile `env` on mobile, and repository variables in GitHub Actions for the Pages build.
- Public env values ship to clients, so they must not be secrets. The database credentials stay in the service. Clients send feedback to `POST /v1/feedback`, and the service writes it to the `feedback` table in PostgreSQL (the validated request plus `id` and `received_at`). It answers 503 `unavailable` when `DATABASE_URL` is not set. The service runs on Railway with a Railway Postgres; `services/api/README.md` covers the deploy. The service validates its env once at startup in `src/config.ts` and lists every variable in `.env.example`.
- `app.json` holds the Android package `com.rensar.unspoken`, which is fixed per app and stays there. The mobile web export adds the GA tag at runtime from `EXPO_PUBLIC_GA_MEASUREMENT_ID`. The Pages workflow sets the web `baseUrl` to `/unspoken`.
- Clients play offline from the bundled `bank` and `gameConfig`. A served config or deck (same schemas) can replace them later without changing screens.

## Testing rules

- Test behavior through public interfaces: package exports, reducers through actions and selectors, and the API client through `createApiClient`. Never import from `src/` internals in another package.
- No tautological tests. Don't assert that a constant equals itself or restate a config table. Assert what a player or caller would notice: the status line after three correct answers, the deck for a seed, contrast passing.
- Mock only at boundaries: network (inject `fetch`), the database (the service's tests run its SQL on PGlite, an in-process Postgres), storage, the clock (dispatch `tick`) and randomness (pass a seed or a `Random`). Don't mock packages or modules.
- Fixtures are small and built in the test file or `test/fixtures.ts`. Content tests may read the real bank to guard the data.
- Every package keeps `lint`, `typecheck` and `test` green. Run `pnpm check` at the root before pushing. The Expo app must also build with `npx expo export --platform web` and `--platform android` from `apps/mobile`.
- UI tests render screens with test data and assert visible text and roles, not styles or snapshots. `apps/mobile/test` renders the real Expo Router app with `renderRouter` and mocks only storage, `fetch`, timers and font loading.

## What is not built yet

- Deploying `services/api` to Railway and setting `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL` to its URL.
- Multiplayer.
