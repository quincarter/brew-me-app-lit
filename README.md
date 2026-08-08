# BrewMe ☕

A ground-up rewrite and complete redesign of the **BrewMe** coffee ratio calculator, timer, and brewing guide app. Built with **Lit Element (Lit 3)**, **TypeScript**, and **Vite** as a modern, high-performance Progressive Web App (PWA).

---

## 🚀 About BrewMe & History

BrewMe was born out of a desire for a clean, accessible, and fast tool to help coffee lovers dial in their daily brews—calculating precise water-to-coffee ratios, timing pour-overs, and learning brewing techniques.

The project has evolved across three major technological iterations:

1. **V1 (Ionic Framework)**: Initially created as a hybrid mobile application built with the Ionic framework.
2. **V2 (Next.js)**: Transitioned into a React and Next.js web application to bring the experience to desktop and mobile web browsers.
3. **V3 (Lit Element - Current Rebuild)**: Completely redesigned and rewritten from the ground up using **Lit 3** and standard Web Components. Moving to Lit eliminated framework overhead, reduced bundle size, dramatically improved cold start times, and ensured long-term maintainability through standard web technology.

---

## ✨ Features

- ⚖️ **Water:Coffee Ratio Calculator**: Synchronized inputs for coffee grounds (g), total water volume (g/oz), cup size, and brew ratios with live calculation.
- 💾 **Saved Brews & Streak Tracking**: Store custom brewing ratios in IndexedDB, categorize brews by type, and automatically track daily brewing streaks.
- ⏱️ **Pour-Over Timer**: Interactive timer for step-by-step coffee extraction.
- 📖 **Curated Brew Method Guides**: Detailed walkthroughs and lazy-loaded YouTube videos for V60, AeroPress, Chemex, French Press, Kalita Wave, Clever Dripper, Espresso, and more.
- 🏆 **World AeroPress Championship (WAC) Recipes**: Transcribed podium recipes (2014–2025) filterable by year with original attributions.
- 📱 **Offline-First PWA**: Precached app shell via Workbox, custom install prompts, seamless updates, and full offline support.
- 🎨 **Adaptive Design & Theming**: Automatic light/dark mode detection with smooth runtime switching. Responsive design adapts seamlessly from mobile bottom tab bar to desktop left navigation rail.

---

## 🛠️ Tech Stack & Tooling

BrewMe utilizes a lean, modern frontend toolchain:

| Tool | Purpose |
| --- | --- |
| **[Lit 3](https://lit.dev/)** | Core UI component framework built on standard Web Components and Shadow DOM. |
| **[TypeScript](https://www.typescriptlang.org/)** | Type safety across the codebase (strict mode enabled). |
| **[Vite](https://vitejs.dev/)** | Lightning-fast development server and production build bundler. |
| **[@lit-labs/preact-signals](https://github.com/lit/lit/tree/main/packages/labs/preact-signals)** | Reactive, fine-grained state management signal stores. |
| **[idb](https://github.com/jakearchibald/idb)** | Promise-based wrapper around IndexedDB for offline data persistence. |
| **[@lit-labs/router](https://github.com/lit/lit/tree/main/packages/labs/router)** | Client-side routing with lazy-loaded view modules. |
| **[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)** | Service worker generation and Workbox precaching for full PWA support. |
| **[Oxlint](https://github.com/oxc-project/oxc)** & **[Oxfmt](https://github.com/oxc-project/oxc)** | High-speed JavaScript/TypeScript linting and formatting. |
| **[Vitest](https://vitest.dev/)** | Fast unit test runner with V8 code coverage. |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/brew-me-app-lit.git
cd brew-me-app-lit
npm install
```

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173`.

### Production Build & Preview

To typecheck and compile the application for production:

```bash
npm run build
```

To preview the built production app locally:

```bash
npm run preview
```

### Testing & Code Quality

Run unit tests with coverage:
```bash
npm test
```

Run linting checks:
```bash
npm run lint
```

Format the codebase:
```bash
npm run fmt
```

---

## 📚 Project Architecture & Contributing

- **Architectural Rationale & AI Context**: Detailed system specs, component architectural patterns, and design implementation context are preserved in [`docs/AI_CONTEXT.md`](./docs/AI_CONTEXT.md).
- **Contributing Guidelines**: Interested in contributing? Please review [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md) for contribution guidelines, coding standards, and PR workflows.
- **License**: BrewMe is open-source software released under the [MIT License](./.github/LICENCE.md).
