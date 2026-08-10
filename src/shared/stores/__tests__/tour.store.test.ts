import { beforeEach, describe, expect, it, vi } from "vitest";
import { withBase } from "../../configuration/base-path";
import { TOUR_STEPS } from "../../data/tour-steps.data";
import {
  isOfflineReadySignal,
  needsRefreshSignal,
} from "../../utilities/register-service-worker.utility";
import { selectedBrewTypeSignal } from "../brew-steps.store";
import {
  deferredInstallPromptSignal,
  installPromptSnoozedSignal,
  isStandaloneSignal,
} from "../install-prompt.store";
import {
  advanceTour,
  currentTourStepSignal,
  endTour,
  isFirstTourStepSignal,
  isLastTourStepSignal,
  markTourSeen,
  maybeAutoStartTour,
  retreatTour,
  skipTour,
  startTour,
  tourActiveSignal,
  tourSeenSignal,
  tourStepIndexSignal,
} from "../tour.store";

const TOUR_SEEN_KEY = "brewme-tour-seen";

describe("tour.store", () => {
  let pushStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    tourActiveSignal.value = false;
    tourStepIndexSignal.value = 0;
    tourSeenSignal.value = false;
    selectedBrewTypeSignal.value = null;
    needsRefreshSignal.value = false;
    deferredInstallPromptSignal.value = null;
    installPromptSnoozedSignal.value = false;
    isStandaloneSignal.value = false;
    isOfflineReadySignal.value = false;
    window.history.pushState({}, "", "/");
    pushStateSpy = vi.spyOn(window.history, "pushState");
  });

  describe("startTour", () => {
    it("activates the tour at step zero and navigates to the first step's route", () => {
      window.history.pushState({}, "", "/some-other-page");
      pushStateSpy.mockClear();

      startTour();

      expect(tourActiveSignal.value).toBe(true);
      expect(tourStepIndexSignal.value).toBe(0);
      expect(pushStateSpy).toHaveBeenCalledWith({}, "", TOUR_STEPS[0].route);
      expect(window.location.pathname).toBe(withBase(TOUR_STEPS[0].route ?? "/"));
    });

    it("doesn't navigate when already on the first step's route", () => {
      window.history.pushState({}, "", withBase(TOUR_STEPS[0].route ?? "/"));
      pushStateSpy.mockClear();

      startTour();

      expect(pushStateSpy).not.toHaveBeenCalled();
    });
  });

  describe("advanceTour", () => {
    it("increments the index and navigates to the next step's route when it differs", () => {
      tourActiveSignal.value = true;
      tourStepIndexSignal.value = 0;
      window.history.pushState({}, "", withBase(TOUR_STEPS[0].route ?? "/"));
      pushStateSpy.mockClear();

      advanceTour();

      expect(tourStepIndexSignal.value).toBe(1);
      expect(pushStateSpy).toHaveBeenCalledWith({}, "", TOUR_STEPS[1].route);
      expect(window.location.pathname).toBe(withBase(TOUR_STEPS[1].route ?? "/"));
    });

    it("doesn't navigate when the next step has no route of its own", () => {
      const quickIndex = TOUR_STEPS.findIndex((step) => step.id === "calculator-quick");
      tourActiveSignal.value = true;
      tourStepIndexSignal.value = quickIndex;
      window.history.pushState({}, "", withBase(TOUR_STEPS[quickIndex].route ?? "/"));
      pushStateSpy.mockClear();

      advanceTour();

      expect(tourStepIndexSignal.value).toBe(quickIndex + 1);
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it("calls reopenBrewTypeChooser's beforeEnter when advancing into the calculator-quick step", () => {
      const quickIndex = TOUR_STEPS.findIndex((step) => step.id === "calculator-quick");
      tourActiveSignal.value = true;
      tourStepIndexSignal.value = quickIndex - 1;
      selectedBrewTypeSignal.value = "V60";

      advanceTour();

      expect(tourStepIndexSignal.value).toBe(quickIndex);
      expect(selectedBrewTypeSignal.value).toBeNull();
    });

    it("ends the tour once advanced past the last step", () => {
      tourActiveSignal.value = true;
      tourStepIndexSignal.value = TOUR_STEPS.length - 1;

      advanceTour();

      expect(tourActiveSignal.value).toBe(false);
      expect(tourStepIndexSignal.value).toBe(TOUR_STEPS.length - 1);
      expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe("1");
      expect(tourSeenSignal.value).toBe(true);
    });
  });

  describe("retreatTour", () => {
    it("decrements the index", () => {
      tourActiveSignal.value = true;
      tourStepIndexSignal.value = 2;

      retreatTour();

      expect(tourStepIndexSignal.value).toBe(1);
    });

    it("is a no-op at index 0", () => {
      tourActiveSignal.value = true;
      tourStepIndexSignal.value = 0;
      pushStateSpy.mockClear();

      retreatTour();

      expect(tourStepIndexSignal.value).toBe(0);
      expect(pushStateSpy).not.toHaveBeenCalled();
    });
  });

  describe("markTourSeen", () => {
    it("persists the seen flag to localStorage and flips tourSeenSignal", () => {
      expect(localStorage.getItem(TOUR_SEEN_KEY)).toBeNull();

      markTourSeen();

      expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe("1");
      expect(tourSeenSignal.value).toBe(true);
    });
  });

  describe("endTour / skipTour", () => {
    it("endTour deactivates the overlay and marks the tour as seen", () => {
      tourActiveSignal.value = true;

      endTour();

      expect(tourActiveSignal.value).toBe(false);
      expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe("1");
      expect(tourSeenSignal.value).toBe(true);
    });

    it("skipTour has the same effect as endTour", () => {
      tourActiveSignal.value = true;

      skipTour();

      expect(tourActiveSignal.value).toBe(false);
      expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe("1");
      expect(tourSeenSignal.value).toBe(true);
    });
  });

  describe("maybeAutoStartTour", () => {
    it("does nothing when the tour has already been seen", () => {
      tourSeenSignal.value = true;
      window.history.pushState({}, "", withBase("/"));

      maybeAutoStartTour();

      expect(tourActiveSignal.value).toBe(false);
    });

    it("does nothing when not on the home route", () => {
      tourSeenSignal.value = false;
      window.history.pushState({}, "", withBase("/more"));

      maybeAutoStartTour();

      expect(tourActiveSignal.value).toBe(false);
    });

    it("starts the tour when unseen and on the home route", () => {
      tourSeenSignal.value = false;
      window.history.pushState({}, "", withBase("/"));

      maybeAutoStartTour();

      expect(tourActiveSignal.value).toBe(true);
      expect(tourStepIndexSignal.value).toBe(0);
    });
  });

  describe("currentTourStepSignal", () => {
    it("is null when the tour isn't active", () => {
      tourActiveSignal.value = false;

      expect(currentTourStepSignal.value).toBeNull();
    });

    it("reflects the step at the current index when active", () => {
      tourActiveSignal.value = true;
      tourStepIndexSignal.value = 1;

      expect(currentTourStepSignal.value).toEqual(TOUR_STEPS[1]);
    });

    it("evaluates to null while the update/refresh prompt is showing", () => {
      tourActiveSignal.value = true;
      needsRefreshSignal.value = true;

      expect(currentTourStepSignal.value).toBeNull();

      needsRefreshSignal.value = false;
      expect(currentTourStepSignal.value).toEqual(TOUR_STEPS[0]);
    });

    it("evaluates to null while the install prompt is showing", () => {
      tourActiveSignal.value = true;
      deferredInstallPromptSignal.value = {} as any;
      isStandaloneSignal.value = false;
      installPromptSnoozedSignal.value = false;
      isOfflineReadySignal.value = true;

      expect(currentTourStepSignal.value).toBeNull();

      deferredInstallPromptSignal.value = null;
      expect(currentTourStepSignal.value).toEqual(TOUR_STEPS[0]);
    });
  });

  describe("isFirstTourStepSignal / isLastTourStepSignal", () => {
    it("is true for isFirstTourStepSignal only at index 0", () => {
      tourStepIndexSignal.value = 0;
      expect(isFirstTourStepSignal.value).toBe(true);

      tourStepIndexSignal.value = 1;
      expect(isFirstTourStepSignal.value).toBe(false);
    });

    it("is true for isLastTourStepSignal only at the final index", () => {
      tourStepIndexSignal.value = TOUR_STEPS.length - 2;
      expect(isLastTourStepSignal.value).toBe(false);

      tourStepIndexSignal.value = TOUR_STEPS.length - 1;
      expect(isLastTourStepSignal.value).toBe(true);
    });
  });
});
