import { computed, signal } from "@lit-labs/preact-signals";
import { withBase } from "../configuration/base-path";
import { getTourSteps } from "../data/tour-steps.data";
import { navigateTo } from "../utilities/navigation.utility";
import { needsRefreshSignal } from "../utilities/register-service-worker.utility";
import { canShowInstallPromptSignal } from "./install-prompt.store";

const TOUR_SEEN_KEY = "brewme-tour-seen";

/** True once the person has completed or skipped the tour at least once - persisted so it never auto-starts again. */
export const tourSeenSignal = signal<boolean>(readSeenState());

/** True while the tour overlay is actively showing a step. */
export const tourActiveSignal = signal<boolean>(false);

/** Index into the active step list for the step currently being shown. */
export const tourStepIndexSignal = signal<number>(0);

/** Active step list dynamically generated based on current app data (e.g. including Brew Again step if present). */
export const activeTourStepsSignal = computed(() => getTourSteps());

/** True when either the custom install prompt or the PWA update/refresh banner is currently visible on screen. */
export const isPromptVisibleSignal = computed(
  () => canShowInstallPromptSignal.value || needsRefreshSignal.value,
);

/** The step object for the current index, or `null` when the tour isn't active or a prompt banner is showing on screen. */
export const currentTourStepSignal = computed(() =>
  tourActiveSignal.value && !isPromptVisibleSignal.value
    ? (activeTourStepsSignal.value[tourStepIndexSignal.value] ?? null)
    : null,
);

/** Whether the Back button should be hidden. */
export const isFirstTourStepSignal = computed(() => tourStepIndexSignal.value === 0);

/** Whether the primary button's label doubles as "finish" (see the last step's "Start brewing" CTA). */
export const isLastTourStepSignal = computed(
  () => tourStepIndexSignal.value === activeTourStepsSignal.value.length - 1,
);

function readSeenState(): boolean {
  return localStorage.getItem(TOUR_SEEN_KEY) === "1";
}

function goToStep(index: number): void {
  const steps = activeTourStepsSignal.value;
  const step = steps[index];
  if (!step) return;

  step.beforeEnter?.();
  tourStepIndexSignal.value = index;

  if (step.route && window.location.pathname !== withBase(step.route)) {
    navigateTo(step.route);
  }
}

/**
 * The single entry point for beginning the tour from step zero - used both
 * by `maybeAutoStartTour` (first visit) and by More's "Take the tour" row
 * (manual replay), so both paths always go through the exact same
 * activation/navigation logic.
 */
export const startTour = (): void => {
  tourActiveSignal.value = true;
  goToStep(0);
};

/** Advances to the next step, or ends the tour if this was the last one. */
export const advanceTour = (): void => {
  const next = tourStepIndexSignal.value + 1;
  const steps = activeTourStepsSignal.value;
  if (next >= steps.length) {
    endTour();
    return;
  }
  goToStep(next);
};

/** Moves back one step. No-op on the first step. */
export const retreatTour = (): void => {
  const prev = tourStepIndexSignal.value - 1;
  if (prev < 0) return;
  goToStep(prev);
};

/** Persists that the tour has been seen so `maybeAutoStartTour` never fires again on this device. */
export const markTourSeen = (): void => {
  localStorage.setItem(TOUR_SEEN_KEY, "1");
  tourSeenSignal.value = true;
};

/** Deactivates the overlay and marks the tour as seen. */
export const endTour = (): void => {
  tourActiveSignal.value = false;
  markTourSeen();
};

/** Alias for the close/"Skip tour" button - same effect as finishing normally. */
export const skipTour = (): void => {
  endTour();
};

/**
 * Called once from `app-shell.ts`'s `firstUpdated()`. Only auto-starts the
 * tour for a first-time visitor who landed on the home route - someone
 * arriving via a deep link (e.g. a shared `/share` brew) shouldn't be yanked
 * away from the page they actually opened, so this deliberately does nothing
 * off `/`. Those visitors can still start the tour manually from More.
 */
export const maybeAutoStartTour = (): void => {
  if (tourSeenSignal.value) return;
  if (window.location.pathname !== withBase("/")) return;
  startTour();
};
