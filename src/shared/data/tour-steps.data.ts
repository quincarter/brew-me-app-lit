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
    kind: "spotlight",
    route: "/",
    targetSelectors: ["home-page", "[data-tour='home-actions']"],
    spotlightPadding: 8,
    title: "Welcome to BrewMe",
    body: "Use quick shortcuts to start a calculator, view saved brews, or run a timer.",
    ctaLabel: "Next",
  },
  {
    id: "more-page",
    kind: "spotlight",
    route: "/more",
    targetSelectors: ["more-page", "[data-tour='more-guides-section']"],
    spotlightPadding: 8,
    title: "Guides & Tools in More",
    body: "Explore brew method guides, pour-over timers, world champion recipes, and app settings.",
    ctaLabel: "Next",
  },
  {
    id: "brew-guide-example",
    kind: "spotlight",
    route: "/more/guide/v60",
    targetSelectors: ["guide-detail-page", "[data-tour='guide-stats']"],
    spotlightPadding: 8,
    title: "Brew Method Specs",
    body: "Each guide highlights ideal ratios, grind sizes, water temperatures, and brewing tips.",
    ctaLabel: "Next",
  },
  {
    id: "calculator-quick",
    kind: "spotlight",
    route: "/calculate",
    beforeEnter: reopenBrewTypeChooser,
    targetSelectors: ["calculator-page", "[data-tour='quick-calculator-button']"],
    spotlightPadding: 8,
    title: "Quick Calculator",
    body: "Quick calculator lets you plug in your own ratio, water, and coffee with zero presets.",
    ctaLabel: "Next",
  },
  {
    id: "calculator-guided",
    kind: "spotlight",
    targetSelectors: ["calculator-page", "brew-type-picker", "[data-tour='type-v60']"],
    spotlightPadding: 6,
    title: "Guided Brew Methods",
    body: "Picking a brew type like V60 gives you prefilled ratios, step-by-step pour guides, and timer cues.",
    ctaLabel: "Next",
  },
  {
    id: "all-set",
    kind: "spotlight",
    targetSelectors: ["calculator-page", "brew-type-picker"],
    spotlightPadding: 8,
    title: "You're All Set!",
    body: "Tap any method to start brewing, or replay this tour anytime from More → Take the tour.",
    ctaLabel: "Start brewing",
  },
];
