# Contributing to BrewMe

Thank you for your interest in contributing to BrewMe! BrewMe is an open-source coffee water:coffee ratio calculator, timer, and brewing guide built with **Lit Element**, **TypeScript**, and **Vite**.

Whether you are fixing a bug, adding a new brew guide, improving accessibility, or proposing a new feature, your contributions are very welcome.

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Getting Started

1. **Fork & Clone the Repository**

   ```bash
   git clone https://github.com/your-username/brew-me-app-lit.git
   cd brew-me-app-lit
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` (or the URL printed in your terminal).

---

## 📜 Development Commands

BrewMe uses fast, modern tooling for linting, formatting, building, and testing:

| Command               | Description                                                                             |
| --------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev`         | Starts the Vite development server with hot-reload and service worker support.          |
| `npm run build`       | Runs TypeScript type checking (`tsc`) and builds for production via Vite.               |
| `npm run preview`     | Serves the production build locally to inspect PWA functionality and production output. |
| `npm run lint`        | Runs `oxlint` to verify code quality and flag potential bugs.                           |
| `npm run lint:fix`    | Automatically fixes auto-fixable lint issues.                                           |
| `npm run fmt`         | Formats code files using `oxfmt`.                                                       |
| `npm run fmt:check`   | Checks if code formatting complies with `oxfmt`.                                        |
| `npm test`            | Runs the Vitest test suite with coverage report.                                        |
| `npm run screenshots` | Uses Playwright to automatically capture and update screenshots in `./screenshots/`.    |

> [!IMPORTANT]
> Always run `npm run build`, `npm run lint`, and `npm test` before creating a pull request. The build step will fail if any TypeScript type errors exist.

---

## 🏗️ Architecture & Coding Standards

### 1. Component Pattern (`src/components/<name>/`)

Every reusable UI component consists of **three files**:

1. **PascalCase Class File** (`Thing.ts`):
   Contains the `LitElement` class implementation. Does _not_ include the `@customElement` decorator or call `customElements.define`.
2. **kebab-case Registration File** (`brew-thing.ts`):
   Imports `Thing` and handles definition safely:
   ```ts
   import { Thing } from "./Thing";

   if (!customElements.get("brew-thing")) {
     customElements.define("brew-thing", Thing);
   }
   ```
   _Note: Always use the explicit `if` check to satisfy `oxlint` rules._
3. **Styles File** (`thing.styles.ts`):
   Exports `ThingStyles` using Lit's `css` tagged template, imported in `Thing.ts`'s `static styles`.

_(Optional)_ Large or complex components should include a local `README.md` documenting props, events, and slots.

### 2. View Architecture (`src/views/<name>/`)

- Each screen is a view in `src/views/<name>/`.
- Views _do_ use the `@customElement` decorator since they are lazy-loaded dynamically by `@lit-labs/router` in `src/app-shell.ts`.
- Route parameters are passed into the view element via a `routeParams` property.

### 3. State Management (`src/shared/stores/`)

State is managed using framework-agnostic Preact Signals (`@lit-labs/preact-signals`):

- **Persistent Stores**: Backed by IndexedDB via `idb` (e.g., `savedBrewsSignal`, custom brew types). Mutate state using exported store methods (`addSavedBrew`, `deleteSavedBrew`), never direct signal assignments from views/components.
- **Ephemeral Stores**: Standard signals for transient UI state (e.g., timer elapsed seconds, calculator inputs).

### 4. Styling & Responsiveness

- Design tokens and dark mode colors are managed using CSS custom properties on `:root` and `[data-theme="dark"]` in `src/index.css`.
- Responsive layouts leverage `EXPANDED_BREAKPOINT_PX = 840` in `src/shared/styles/responsive.styles.ts`. Mobile layouts use bottom tab navigation, while wider screens transition to a fixed left rail.

### 5. Type Safety & Testing

- **Strict TypeScript**: `noImplicitAny`, `strict`, `noUnusedLocals`, and `noUnusedParameters` are enabled. Provide explicit types for function parameters, return types, interfaces, and signals.
- **Testing**: Write unit tests using Vitest (`*.utility.test.ts` or `*.store.test.ts`) under `__tests__/` subdirectories.

---

## 🔀 Pull Request Process

1. **Branching**: Create a feature or fix branch from `main`:
   ```bash
   git checkout -b feature/add-new-brew-guide
   ```
2. **Commit Messages**: Write clear, descriptive commit messages describing _what_ changed and _why_.
3. **Verification**: Verify type safety, linting, and unit tests:
   ```bash
   npm run build && npm run lint && npm test
   ```
4. **Submit PR**: Push your branch to GitHub and open a Pull Request against `main`. Provide a concise summary of changes and screenshots for visual updates.

Thank you for helping make BrewMe better for coffee enthusiasts everywhere! ☕
