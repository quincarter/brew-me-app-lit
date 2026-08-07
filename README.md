# BrewMe (Lit rebuild)

A ground-up implementation of the "BrewMe Redesign" Claude Design concept as a
real, installable Lit + TypeScript + Vite application: a coffee water:coffee
ratio calculator with saved brews, a pour-over timer, and a brew method
guide.

## Origin

The UI/behavior spec came from a Claude Design canvas file
(`BrewMe Redesign.dc.html`) prototyped with `@material/web` components. This
project re-implements that same spec as hand-written Lit components, following
the conventions from `app-shell-starter`:

- Reusable components live in `src/components/<name>/` as three files: a
  PascalCase class (`Thing.ts`), a kebab-case registration file that calls
  `customElements.define` (`brew-thing.ts`), and a `thing.styles.ts` file
  exporting a `ThingStyles` `css` tagged template. A few of the more
  general-purpose ones also have a `README.md`.
- Views live in `src/views/<name>/` as a single `@customElement`-decorated
  file plus a sibling `.styles.ts` file, and are lazy-loaded per route.
- App state lives in small, framework-agnostic signal stores under
  `src/shared/stores/`, using `@lit-labs/preact-signals`. Saved brews persist
  to IndexedDB via the same `persistentSignal` helper pattern as the starter;
  calculator/timer state is intentionally ephemeral (plain signals). There's
  no seed/mock data - `savedBrewsSignal` starts empty and the day streak is a
  real `computed()` over each saved ratio's `createdAt` timestamp, not a
  hardcoded number.
- Routing uses `@lit-labs/router`, configured in `src/app-shell.ts` with
  lazy-imported view modules, matching the starter's `enter`/`render` shape.
- Theming uses CSS custom properties on `:root` / `[data-theme="dark"]` in
  `src/index.css`, plus the same `detect-color-scheme.js` head script and a
  small `brew-theme-toggle` component (adapted from the starter's
  `ThemeSwitcher`).
- Brew guide detail screens list curated YouTube walkthroughs above the
  existing "search YouTube" prompt (which is kept). Videos are lazy:
  `brew-video-card` renders only a poster image until you click it, then
  swaps in a `youtube-nocookie.com` iframe, so no YouTube scripts or cookies
  load otherwise. Technique carries across pour-over brewers, so V60, Chemex,
  Kalita Wave and Origami share one video set.
- The AeroPress guide links through to a **WAC Recipes** screen
  (`/more/aeropress-recipes`): World AeroPress Championship podium recipes
  from 2014–2025, transcribed into structured data
  (`shared/data/aeropress-recipes.data.ts`), filterable by year and expandable
  per recipe, with attribution linking back to
  [worldaeropresschampionship.com](https://worldaeropresschampionship.com/pages/recipes).
- Layout is responsive at every width, not just a mobile mockup: below 840px
  it's a full-bleed phone layout with a bottom tab bar; at 840px and up
  `brew-bottom-nav` becomes a fixed left navigation rail, screen content sits
  in a centered ~640px-max column, and the save-ratio bottom sheet becomes a
  centered modal dialog. Breakpoint/width constants live in
  `src/shared/styles/responsive.styles.ts`.
- BrewMe is a full PWA via `vite-plugin-pwa` (`vite.config.ts`):
  - **Icons/splash**: the app's own icon set in `public/icons/` drives the
    manifest, home-screen icon, and favicon (`public/icon/favicon.png`).
    Android/Chrome build their install splash screen straight from the
    manifest icon automatically; iOS has no such mechanism, so
    `index.html` also links generated `apple-touch-startup-image` splash
    images (`public/splash/`, produced by centering the icon on the app's
    background color) for a full-screen icon splash there too.
  - **Offline**: Workbox precaches the entire built app shell
    (JS/CSS/HTML/icons) with `navigateFallback: "/index.html"`, so every
    route keeps working with no network at all after the first visit. The
    Google Fonts `<link>` tags are runtime-cached (stylesheet:
    stale-while-revalidate, font files: cache-first) so text keeps
    rendering in the brand typeface offline too, once it's been fetched
    once.
  - **Custom install prompt**: `brew-install-prompt`
    (`src/components/install-prompt/`) replaces the browser's default
    install UI. `install-prompt.store.ts` captures `beforeinstallprompt`
    (preventing the native mini-infobar) and exposes it as a signal; the
    component only renders once that event has actually fired, and shows
    the real app icon plus two screen previews
    (`public/screenshots/home.png` / `calculator.png`) so people can see
    what they're installing. "Not now" snoozes the prompt for 7 days via
    `localStorage`; those same two screenshots are also registered in the
    manifest's `screenshots` field so Chrome/Edge's own richer install
    dialog picks them up too.
  - **Update prompt**: `registerType: "prompt"` - a new deployed version
    installs and waits instead of swapping itself in silently. Once it's
    ready, `onNeedRefresh` (`register-service-worker.utility.ts`) flips
    `needsRefreshSignal`, which `brew-update-prompt`
    (`src/components/update-prompt/`) watches to show a small floating
    "A new version of BrewMe is ready" snackbar - not a modal, no scrim,
    doesn't block the app underneath. "Refresh" calls `applyUpdate()`
    (activates the waiting worker, reloads once it takes control);
    "Later" just hides the banner for now, and it reappears on the next
    visit if the update's still pending. The Settings screen's "Refresh
    app" button (`refreshApp`) is a separate, always-available manual
    fallback for the rare case a new version hasn't been detected yet.
- The ratio inputs (ratio field, linked Water (g) / Cup size (oz) row, live
  "coffee needed" result) are a single shared, controlled component -
  `brew-ratio-form` (`src/components/ratio-form/`) - used on both the
  Calculator screen and the Saved Ratio Detail screen's edit mode, so the
  two look and behave identically. It doesn't own the water/oz/ratio linking
  math itself; each screen keeps that (Calculator via `calculator.store.ts`,
  Saved Ratio Detail via local `@state`) and feeds values back in as
  properties. On Saved Ratio Detail, a single primary button above "Delete
  ratio" doubles as the mode toggle: "Edit ratio" swaps the read-only
  ratio/stat boxes for a brew-type picker plus `brew-ratio-form`, both
  seeded from the saved brew; the same button then reads "Save changes"
  and, once clicked, persists the (possibly retyped) brew along with the
  edited ratio and swaps back to the boxes with the updated values.
- Brew types aren't a fixed list - `brew-type-picker`
  (`src/components/type-picker/`) is a shared, controlled chip grid with a
  built-in "+ Add brew type" affordance, used identically in both the Save
  sheet (post-creation) and the Saved Ratio Detail edit flow. New types go
  through `addCustomBrewType` (`shared/stores/brew-types.store.ts`, trimmed
  and case-insensitively deduped against the stock `BREW_TYPES` list) and
  persist to IndexedDB the same way saved brews do; `allBrewTypesSignal`
  (stock + custom) is what both flows actually render.
- A **Settings** screen (`/more/settings`, linked from a new section on
  More) covers everything that isn't a brewing action: managing custom
  brew types (add, and remove ones you added - built-in types are fixed),
  a dark-mode switch (`brew-switch`, sharing `theme.store.ts` with the
  floating `brew-theme-toggle` so both always agree), a "Refresh app"
  button (a manual fallback alongside the automatic `brew-update-prompt`
  banner described below), and a danger zone that wipes all saved brews
  and custom brew types behind an inline "are you sure" confirmation (no
  browser `confirm()` dialogs).
  `brew-button` gained a `tone="danger"` option for that last one.

## What's intentionally simplified vs. app-shell-starter

This app has a fixed set of screens with no multi-tenant navigation, access
control, or micro-frontend loading, so the heavier `ViewMixin` /
`NavigationContext` / `MfeLoader` machinery from the starter was left out.
Route params are passed to views via a plain `routeParams` property instead.
Biome/Husky were left out of this scaffold to keep the dependency footprint
small — they can be layered back in the same way the starter configures them.

## Scripts

- `npm run dev` – start the Vite dev server
- `npm run build` – type-check (`tsc`) then build
- `npm run preview` – preview the production build
- `npm test` – run the Vitest unit tests with coverage

## Structure

```
src/
  app-shell.ts / app-shell.styles.ts   – root element, router, full-viewport shell
  index.css                            – design tokens (light/dark) + base styles
  components/                          – reusable Lit components
  views/                               – one folder per screen/route
  shared/
    configuration/                     – routes.ts, base-path.ts
    stores/                            – signal stores (brew, brew-types, calculator, timer, save-dialog, theme, install-prompt)
    data/                              – static brew type + brew guide content
    interfaces/                        – shared TypeScript types
    styles/                            – responsive.styles.ts (shared breakpoint constants)
    utilities/                         – pure helper functions (+ unit tests)
```
