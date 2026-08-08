# BrewMe Architectural & Implementation Context

> [!NOTE]
> This document contains deep architectural, technical, and historical background on the BrewMe Lit rebuild. It is maintained to provide comprehensive context for AI assistants, subagents, and contributors exploring system design.

## Origin & Design Concept

The UI/behavior spec originated from a Claude Design canvas prototype (`BrewMe Redesign.dc.html`) built with `@material/web` components. This codebase re-implements that specification as hand-written, standard Lit components following conventions adapted from `app-shell-starter`:

- **Component Architecture**: Reusable components live in `src/components/<name>/` as three distinct files:
  - PascalCase class file (`Thing.ts`)
  - kebab-case custom element registration file (`brew-thing.ts`) guarding `customElements.define`
  - `thing.styles.ts` file exporting `ThingStyles` as a `css` tagged template
  - Documented components also contain a local `README.md`.
- **Views**: Views live in `src/views/<name>/` as a single `@customElement`-decorated file plus a sibling `.styles.ts` file, lazy-loaded per route.
- **State Management**: App state lives in small, framework-agnostic signal stores under `src/shared/stores/`, using `@lit-labs/preact-signals`.
  - **Saved Brews**: Persisted to IndexedDB via the `persistentSignal` helper pattern. `savedBrewsSignal` starts empty, and the day streak is a real `computed()` over each saved ratio's `createdAt` timestamp.
  - **Calculator & Timer**: Intentionally ephemeral signals reset on reload.
- **Routing**: Powered by `@lit-labs/router`, configured in `src/app-shell.ts` with lazy-imported view modules matching the starter's `enter`/`render` contract.
- **Theming**: Uses CSS custom properties on `:root` / `[data-theme="dark"]` in `src/index.css`, driven by `detect-color-scheme.js` pre-render head script and `brew-theme-toggle` (`shared/stores/theme.store.ts`).
- **Brew Guides**: Detail screens list curated YouTube walkthroughs above the YouTube search prompt. Videos are lazy: `brew-video-card` renders a poster image until clicked, then swaps in a `youtube-nocookie.com` iframe. Each brewer has its own video list (`shared/data/brew-content.data.ts`). A generic `guide-detail-page` (`/more/guide/:id`) is driven entirely by `BREW_GUIDE` - adding a new brewer (e.g., Hario Switch or Clever Dripper) requires only data entry. `IBrewGuideItem` supports `externalLinks` to external resources like Roastopedia.
- **AeroPress Recipes**: The AeroPress guide links to a WAC Recipes screen (`/more/aeropress-recipes`) containing World AeroPress Championship podium recipes (2014–2025) transcribed into structured data (`shared/data/aeropress-recipes.data.ts`).
- **Responsive Layout**: Full-bleed phone layout with bottom navigation bar below `840px`. At `840px` and up (`EXPANDED_BREAKPOINT_PX`), `brew-bottom-nav` transforms into a fixed left rail (`88px`), screen content centers in a `640px` column, and sheets convert to modal dialogs.
- **Progressive Web App (PWA)**: Built using `vite-plugin-pwa`:
  - **Icons & Splash**: Custom icon set in `public/icons/` drives manifest and favicons. iOS startup splash images are generated in `public/splash/`.
  - **Offline Capability**: Workbox precaches the app shell with `navigateFallback: "/index.html"`. Google Fonts are runtime cached.
  - **SPA Fallback**: `public/_redirects` rewrites all paths to `/index.html` with HTTP 200 for Netlify deployment.
  - **Custom Install Prompt**: `brew-install-prompt` (`src/components/install-prompt/`) captures `beforeinstallprompt` via `install-prompt.store.ts`.
  - **Update Prompt**: `registerType: "prompt"` triggers `brew-update-prompt` when a new service worker is waiting.
- **Shared Controlled Form**: `brew-ratio-form` (`src/components/ratio-form/`) is shared between the Calculator view and Saved Ratio Detail view for consistent inputs.
- **Custom Brew Types**: `brew-type-picker` (`src/components/type-picker/`) allows adding custom brew types via `addCustomBrewType` (`shared/stores/brew-types.store.ts`) saved to IndexedDB.
- **Settings & Data Management**: Settings view (`/more/settings`) manages custom brew types, dark mode switch, manual app refresh, and clearing stored data behind confirmation logic.

## Simplifications vs. `app-shell-starter`

BrewMe targets a focused set of user flows without multi-tenant navigation, RBAC, or micro-frontend modules. Consequently, heavy `ViewMixin`, `NavigationContext`, and `MfeLoader` abstractions are omitted in favor of simple `routeParams` props passed directly into lazy-loaded views.

## File & Directory Layout

```
src/
  app-shell.ts / app-shell.styles.ts   – Root element, router setup, viewport shell
  index.css                            – Design tokens (light/dark) & global base styles
  components/                          – Reusable Lit components (3-file structure)
  views/                               – Application screens / routes
  shared/
    configuration/                     – Route declarations & base path helpers
    stores/                            – Preact Signal stores (brew, brew-types, calculator, timer, etc.)
    data/                              – Static data (brew guide, WAC recipes)
    interfaces/                        – TypeScript interfaces & types (prefixed with `I`)
    styles/                            – Shared responsive breakpoint constants
    utilities/                         – Helper functions and matching Vitest unit tests
```
