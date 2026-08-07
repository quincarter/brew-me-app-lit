# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BrewMe: a Lit 3 + TypeScript + Vite PWA — a coffee water:coffee ratio calculator with saved ratios, a pour-over timer, and a brew method guide. It's a from-scratch reimplementation of a design prototype, following the conventions of an internal `app-shell-starter` template (see `README.md` for the full rationale behind each convention below).

## Commands

```bash
npm run dev          # start the Vite dev server (PWA service worker also registers in dev)
npm run build         # tsc typecheck (noEmit) + vite build — build fails on any type error
npm run preview       # preview the production build
npm test              # vitest run --coverage — full suite, single run, with coverage
npm run lint           # oxlint
npm run lint:fix       # oxlint --fix
npm run fmt             # oxfmt
npm run fmt:check       # oxfmt --check
```

Running a single test file or test case (vitest, not wired as an npm script):

```bash
npx vitest run src/shared/utilities/__tests__/ratio.utility.test.ts
npx vitest run -t "converts grams to ounces"
npx vitest             # watch mode
```

There is no separate `typecheck` script — `tsc` runs as part of `npm run build`. `noUnusedLocals`, `noUnusedParameters`, and `strict` are all on, so unused locals/params fail the build, not just lint.

## Architecture

### Component pattern (`src/components/<name>/`)

Every reusable component is **three files**, not one:

- `Thing.ts` — PascalCase, the actual `LitElement` subclass. No `@customElement` decorator and no `customElements.define` call here.
- `brew-thing.ts` — kebab-case, does exactly one thing: `import { Thing } from "./Thing"` then guards registration:
  ```ts
  if (!customElements.get("brew-thing")) {
    customElements.define("brew-thing", Thing);
  }
  ```
  Always use the `if` form, not `!customElements.get(...) && customElements.define(...)` — the latter trips oxlint's `no-unused-expressions`.
- `thing.styles.ts` — exports a single `ThingStyles` `css` tagged template, imported into `Thing.ts`'s `static styles`.

A few of the more general-purpose components (`button`, `text-field`, `bottom-nav`, `list-row`, `video-card`) also have a `README.md` documenting their API — check for one before guessing a component's props/events/slots.

### Views (`src/views/<name>/`)

One `@customElement`-decorated file per screen plus a sibling `.styles.ts`. Views *are* registered inline (unlike components) since they're only ever loaded once, lazily, by the router. Route params arrive via a plain `routeParams` property (no `ViewMixin`/`NavigationContext` machinery — this app has a fixed screen set with no access control or multi-tenant nav).

### Routing (`src/app-shell.ts` + `src/shared/configuration/routes.ts`)

`@lit-labs/router`, configured from the `routes` array — each entry lazy-imports its view module (`./views/${directory}/${fileName}.ts`) on first visit via `enter()`. To add a screen: add a view folder, then a `routes.ts` entry (`name`, `path`, `tagName`, `directory`, `fileName`).

### State (`src/shared/stores/`)

Small, framework-agnostic signal stores using `@lit-labs/preact-signals` (`signal`, `computed`, `effect`) — not a Lit `ReactiveController` pattern. Two flavors:

- **Persistent**: `persistentSignal(defaultValue, { key })` (`persistent-signal.ts`) backed by IndexedDB via `idb`. Used for `savedBrewsSignal` (`brew.store.ts`). No seed/mock data — it starts empty; `streakDaysSignal` is a real `computed()` over saved ratios' `createdAt`, not a hardcoded number.
- **Ephemeral**: plain `signal()` for calculator/timer/save-dialog state — intentionally lost on reload.

Mutations go through exported functions (`addSavedBrew`, `updateSavedBrew`, `deleteSavedBrew`), not direct `.value =` writes from components.

### Theming

CSS custom properties on `:root` (light) / `[data-theme="dark"]` (dark) in `src/index.css`. Color scheme is detected pre-render by a head script (`detect-color-scheme.js`, referenced from `index.html`) to avoid a flash, and toggled at runtime by `brew-theme-toggle`.

### Responsive layout (`src/shared/styles/responsive.styles.ts`)

Single breakpoint (`EXPANDED_BREAKPOINT_PX = 840`). Below it: full-bleed phone layout, `brew-bottom-nav` renders as a bottom tab bar, save-ratio flow is a bottom sheet. At/above it: `brew-bottom-nav` becomes a fixed left rail (`RAIL_WIDTH_PX = 88`), content centers in a `CONTENT_MAX_WIDTH_PX = 640` column, the save sheet becomes a centered modal. Any new view should spread `responsiveScreenStyles` into its `static styles` to get the rail-clearance/content-centering behavior for free.

### PWA (`vite.config.ts`, `vite-plugin-pwa`)

- `registerType: "autoUpdate"` — updates activate silently, no reload prompt.
- Workbox precaches the whole built app shell with `navigateFallback: "/index.html"` — every route works fully offline after first load.
- Install UI is custom (`brew-install-prompt` + `install-prompt.store.ts`), not the browser default — `injectRegister: null` disables the plugin's own toast.

### Types & naming

Shared types live in `src/shared/interfaces/*.interface.ts` and are prefixed `I` (`ISavedBrew`, `IRouteConfig`, `IBrewGuideItem`). Utilities live in `src/shared/utilities/*.utility.ts` as pure functions, each with a matching test in a sibling `__tests__/` folder (`name.utility.test.ts`).

## Subagents

Five project subagents live in `.claude/agents/`. Claude Code routes matching work to them automatically based on their `description`; you can also invoke one explicitly (e.g. "have the code-reviewer subagent check this" or via the Agent tool with that subagent type).

| Agent | Use for |
|---|---|
| `lit-expert` | Adding/modifying components or views, signal stores, routing — anything that needs to follow the three-file component pattern, the view/router shape, or the signal-store conventions above. |
| `typescript-expert` | Type errors, strict-mode fallout (`noUnusedLocals`/`noUnusedParameters`), interface/type design, generics, module resolution issues. |
| `testing-expert` | Writing or fixing Vitest tests for utilities/stores, diagnosing `npm test` failures, coverage gaps. |
| `ui-designer` | Visual/UX work: design tokens in `index.css`, light/dark theme parity, responsive rail/bottom-nav behavior, keeping new components visually consistent with the existing Material-inspired look. |
| `code-reviewer` | Proactive review after a change is made — checks it against the conventions in this file, lint/type correctness, and Lit best practices. Read-only: it reports findings rather than editing. |

Default to running `code-reviewer` after any non-trivial change, before considering the task done.
