import type { GuidedTimerMode } from "./timer.store";
import { persistentSignal } from "./persistent-signal";

/**
 * Default guided-timer counting direction applied when a new recipe/brew is
 * primed on the Timer screen (see `primeTimerForRecipe` in `timer.store.ts`).
 * Purely a default - the Timer's own mode chips (`setGuidedMode`) can still
 * override it for that one session, same as `brew-type-features.store.ts`'s
 * per-brew overrides don't change its global default. Persisted to
 * IndexedDB via the same `persistentSignal` pattern as
 * `brewTypeFeaturesSignal` - defaults to "countdown" to match today's
 * implicit behavior when a recipe has a target duration.
 */
export const timerCountStyleSignal = persistentSignal<GuidedTimerMode>("countdown", {
  key: "timer-count-style",
});

/**
 * Whether `brew-active-step-banner` (the large step-progress banner shown
 * while a guided timer with steps is running) appears at all. Defaults to
 * `true` - today's always-on behavior, unchanged unless the user turns it
 * off on the Settings screen.
 */
export const showActiveStepBannerSignal = persistentSignal<boolean>(true, {
  key: "timer-show-active-step-banner",
});

export function setTimerCountStyle(mode: GuidedTimerMode): void {
  timerCountStyleSignal.value = mode;
}

export function setShowActiveStepBanner(value: boolean): void {
  showActiveStepBannerSignal.value = value;
}
