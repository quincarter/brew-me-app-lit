import type { ITourStep } from "../interfaces/tour.interface";
import { reopenBrewTypeChooser } from "../stores/brew-steps.store";

/**
 * The fixed script for the first-time-visitor onboarding tour, driven by
 * `tour.store.ts`. Each step either shows a centered "slide" card (optionally
 * after navigating to a new route) or a "spotlight" card anchored to a real
 * on-screen element, found via `targetSelectors` (see `tour-target.utility.ts`).
 */
export const TOUR_STEPS: ITourStep[] = [
  {
    id: "home-welcome",
    kind: "slide",
    route: "/",
    title: "Welcome to BrewMe",
    body: "BrewMe helps you dial in coffee ratios, save your favorite brews, and follow guided pour-over steps. Let's take a quick look around.",
    ctaLabel: "Next",
  },
  {
    id: "more-page",
    kind: "slide",
    route: "/more",
    title: "Everything else lives in More",
    body: "Settings, a pour-over timer, WAC and V60 recipe collections, and a full brew method guide are all one tap away.",
    ctaLabel: "Next",
  },
  {
    id: "brew-guide-example",
    kind: "slide",
    route: "/more/guide/v60",
    title: "Brew method guides",
    body: "Each method has its own ratio hint, grind size, and tips — like this V60 guide.",
    ctaLabel: "Next",
  },
  {
    id: "calculator-quick",
    kind: "spotlight",
    route: "/calculate",
    beforeEnter: reopenBrewTypeChooser,
    targetSelectors: ["calculator-page", "[data-tour='quick-calculator-button']"],
    spotlightPadding: 8,
    title: "Just want numbers?",
    body: "Quick calculator is a completely blank slate — plug in your own ratio, water, and coffee with zero guidance.",
    ctaLabel: "Next",
  },
  {
    id: "calculator-guided",
    kind: "spotlight",
    targetSelectors: ["calculator-page", "brew-type-picker", "[data-tour='type-v60']"],
    spotlightPadding: 6,
    title: "Or pick your method",
    body: "Picking a brew type like V60 gives you a guided, prefilled flow — preset ratios, steps, and tips for that method.",
    ctaLabel: "Next",
  },
  {
    id: "all-set",
    kind: "slide",
    title: "You're all set",
    body: "Start the calculator whenever you're ready, or replay this tour anytime from More → Take the tour.",
    ctaLabel: "Start brewing",
  },
];
