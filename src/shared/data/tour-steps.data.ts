import type { ITourStep } from "../interfaces/tour.interface";
import { reopenBrewTypeChooser } from "../stores/brew-steps.store";
import { mostRecentlyBrewedSignal } from "../stores/brew.store";

/**
 * Returns the script of steps for the onboarding tour.
 * If the user has a recent brew, a "Jump right back in" step is prepended to highlight
 * the "Brew Again" card before explaining quick actions.
 */
export const getTourSteps = (): ITourStep[] => {
  const steps: ITourStep[] = [];

  if (mostRecentlyBrewedSignal.value) {
    steps.push({
      id: "home-brew-again",
      kind: "spotlight",
      route: "/",
      targetSelectors: ["home-page", "[data-tour='brew-again-card']"],
      spotlightPadding: 8,
      title: "Jump right back in",
      body: "Your most recent brew is pinned right at the top so you can repeat your favorite ratio with one tap.",
      ctaLabel: "Next",
    });
  }

  steps.push({
    id: "home-welcome",
    kind: "spotlight",
    route: "/",
    targetSelectors: ["home-page", "[data-tour='home-actions']"],
    spotlightPadding: 8,
    title: "Quick actions",
    body: "Use quick shortcuts to start a calculator, view saved brews, or run a timer.",
    ctaLabel: "Next",
  });

  steps.push({
    id: "more-page",
    kind: "spotlight",
    route: "/more",
    targetSelectors: ["more-page", "[data-tour='more-guides-section']"],
    spotlightPadding: 8,
    title: "Guides & Tools in More",
    body: "Explore brew method guides, pour-over timers, world champion recipes, and app settings.",
    ctaLabel: "Next",
  });

  steps.push({
    id: "brew-guide-example",
    kind: "spotlight",
    route: "/more/guide/v60",
    targetSelectors: ["guide-detail-page", "[data-tour='guide-stats']"],
    spotlightPadding: 8,
    title: "Brew Method Specs",
    body: "Each guide highlights ideal ratios, grind sizes, water temperatures, and brewing tips.",
    ctaLabel: "Next",
  });

  steps.push({
    id: "calculator-quick",
    kind: "spotlight",
    route: "/calculate",
    beforeEnter: reopenBrewTypeChooser,
    targetSelectors: ["calculator-page", "[data-tour='quick-calculator-button']"],
    spotlightPadding: 8,
    title: "Quick Calculator",
    body: "Quick calculator lets you plug in your own ratio, water, and coffee with zero presets.",
    ctaLabel: "Next",
  });

  steps.push({
    id: "calculator-guided",
    kind: "spotlight",
    targetSelectors: ["calculator-page", "brew-type-picker", "[data-tour='type-v60']"],
    spotlightPadding: 6,
    title: "Guided Brew Methods",
    body: "Picking a brew type like V60 gives you prefilled ratios, step-by-step pour guides, and timer cues.",
    ctaLabel: "Next",
  });

  steps.push({
    id: "all-set",
    kind: "spotlight",
    targetSelectors: ["calculator-page", "brew-type-picker"],
    spotlightPadding: 8,
    title: "You're All Set!",
    body: "Tap any method to start brewing, or replay this tour anytime from More → Take the tour.",
    ctaLabel: "Start brewing",
  });

  return steps;
};

/** Static reference for backwards-compatibility in tests */
export const TOUR_STEPS: ITourStep[] = getTourSteps();
