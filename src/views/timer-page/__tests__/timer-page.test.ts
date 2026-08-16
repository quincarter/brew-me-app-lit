import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IBrewStep, ISavedBrew } from "../../../shared/interfaces/brew.interface";
import type { IPrimedRecipe } from "../../../shared/interfaces/timer.interface";
import { brewTypeFeaturesSignal } from "../../../shared/stores/brew-type-features.store";
import { savedBrewsSignal } from "../../../shared/stores/brew.store";
import {
  devicesBannerDismissedSignal,
  monitorConnectionStateSignal,
  scaleConnectionStateSignal,
} from "../../../shared/stores/device-connection.store";
import { clearTelemetry, telemetrySealedSignal } from "../../../shared/stores/telemetry.store";
import { showActiveStepBannerSignal } from "../../../shared/stores/timer-settings.store";
import {
  guidedModeSignal,
  primedRecipeSignal,
  resetTimer,
  timerRunningSignal,
  timerSecondsSignal,
} from "../../../shared/stores/timer.store";
import "../timer-page";
import type { TimerPage } from "../timer-page";

const makeSavedBrew = (overrides: Partial<ISavedBrew> = {}): ISavedBrew => ({
  id: 1,
  brewType: "V60",
  ratio: 16,
  water: 320,
  coffee: 20,
  oz: 11,
  createdAt: Date.now(),
  ...overrides,
});

const primedRecipe = (overrides: Partial<IPrimedRecipe> = {}): IPrimedRecipe => ({
  name: "V60",
  brewType: "V60",
  coffee: 20,
  water: 320,
  ratio: 16,
  targetSeconds: 210,
  steps: null,
  ...overrides,
});

describe("timer-page", () => {
  let element: TimerPage;

  const mount = async (): Promise<void> => {
    element = document.createElement("timer-page") as TimerPage;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  const dial = (): (HTMLElement & { countdown: boolean; idle: boolean }) | null =>
    element.shadowRoot?.querySelector("brew-timer-dial") as
      | (HTMLElement & { countdown: boolean; idle: boolean })
      | null;

  const controls = (): (HTMLElement & { hasSavedBrews: boolean }) | null =>
    element.shadowRoot?.querySelector("brew-timer-controls") as
      | (HTMLElement & { hasSavedBrews: boolean })
      | null;

  const resetButton = (): Element | null =>
    element.shadowRoot?.querySelector('brew-icon-button[aria-label="Reset"]') ?? null;

  const clearButton = (): Element | null =>
    element.shadowRoot?.querySelector('brew-icon-button[aria-label="Clear brew"]') ?? null;

  const fab = (): Element | null => element.shadowRoot?.querySelector(".dial-fab") ?? null;

  const dialHint = (): Element | null => element.shadowRoot?.querySelector(".dial-hint") ?? null;

  const fireIconClick = (el: Element | null): void => {
    el?.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));
  };

  const recipePanel = (): (HTMLElement & { recipe: IPrimedRecipe | null }) | null =>
    element.shadowRoot?.querySelector("brew-timer-recipe-panel") as
      | (HTMLElement & { recipe: IPrimedRecipe | null })
      | null;

  /**
   * `brew-collapsible-banner` stays mounted whether open or closed (so its exit animation can
   * play), so presence in the DOM no longer indicates visibility - these look up the wrapper by
   * its content and assert on its `open` property instead. There are two such wrappers once Web
   * Bluetooth is supported (the devices banner and the "go to Settings" notice), told apart by
   * their `.devices-banner-title` text.
   */
  const collapsibleBannerByTitle = (title: string): (HTMLElement & { open: boolean }) | null => {
    const titleEl = Array.from(
      element.shadowRoot?.querySelectorAll(".devices-banner-title") ?? [],
    ).find((el) => el.textContent === title);
    return (
      (titleEl?.closest("brew-collapsible-banner") as (HTMLElement & { open: boolean }) | null) ??
      null
    );
  };

  const devicesBannerWrapper = (): (HTMLElement & { open: boolean }) | null =>
    collapsibleBannerByTitle("Connect your devices");

  const settingsNoticeWrapper = (): (HTMLElement & { open: boolean }) | null =>
    collapsibleBannerByTitle("To access connected devices, go to Settings");

  beforeEach(() => {
    resetTimer();
    primedRecipeSignal.value = null;
    guidedModeSignal.value = "countdown";
    savedBrewsSignal.value = [];
    brewTypeFeaturesSignal.value = {};
  });

  afterEach(() => {
    resetTimer();
    clearTelemetry();
    element.remove();
  });

  describe("title", () => {
    it("shows the generic title when unprimed", async () => {
      await mount();

      const topBar = element.shadowRoot?.querySelector("brew-top-bar") as
        | (HTMLElement & { title: string })
        | undefined;
      expect(topBar?.title).toBe("Pour-over Timer");
    });

    it("shows the generic title when primed with a brewType of null (custom/unmatched brew type)", async () => {
      primedRecipeSignal.value = primedRecipe({ brewType: null });
      await mount();

      const topBar = element.shadowRoot?.querySelector("brew-top-bar") as
        | (HTMLElement & { title: string })
        | undefined;
      expect(topBar?.title).toBe("Pour-over Timer");
    });

    it("shows a brewType-specific title when primed with a matched brew guide entry", async () => {
      primedRecipeSignal.value = primedRecipe({ brewType: "V60" });
      await mount();

      const topBar = element.shadowRoot?.querySelector("brew-top-bar") as
        | (HTMLElement & { title: string })
        | undefined;
      expect(topBar?.title).toBe("V60 Timer");
    });
  });

  describe("idle state", () => {
    it("renders brew-timer-controls and no dial-cluster controls when nothing is primed, running, or elapsed", async () => {
      await mount();

      expect(controls()).not.toBeNull();
      expect(resetButton()).toBeNull();
      expect(clearButton()).toBeNull();
      expect(fab()).toBeNull();
      expect(dialHint()).toBeNull();
    });

    it("does not tell brew-timer-controls there are saved brews when there are none", async () => {
      await mount();

      expect(controls()?.hasSavedBrews).toBe(false);
    });

    it("tells brew-timer-controls there are saved brews once one is saved", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      expect(controls()?.hasSavedBrews).toBe(true);
    });

    it("starts the timer when brew-timer-controls fires start-click", async () => {
      await mount();
      expect(timerRunningSignal.value).toBe(false);

      controls()?.dispatchEvent(new CustomEvent("start-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(timerRunningSignal.value).toBe(true);
    });

    it("swaps brew-timer-controls for the dial-cluster controls once the timer is running", async () => {
      await mount();

      controls()?.dispatchEvent(new CustomEvent("start-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(controls()).toBeNull();
      expect(resetButton()).not.toBeNull();
      expect(fab()).not.toBeNull();
    });

    it("swaps brew-timer-controls for the dial-cluster controls once a recipe is primed, even while not running", async () => {
      await mount();
      expect(controls()).not.toBeNull();

      primedRecipeSignal.value = primedRecipe();
      await element.updateComplete;

      expect(controls()).toBeNull();
      expect(resetButton()).not.toBeNull();
    });
  });

  describe("dial-cluster controls", () => {
    it("fires resetTimer (resetting elapsed seconds) when the reset button is activated", async () => {
      primedRecipeSignal.value = primedRecipe();
      timerSecondsSignal.value = 42;
      await mount();

      fireIconClick(resetButton());
      await element.updateComplete;

      expect(timerSecondsSignal.value).toBe(0);
      // resetTimer deliberately leaves the primed recipe alone.
      expect(primedRecipeSignal.value).not.toBeNull();
    });

    it("hides the clear (X) button when no recipe is primed, leaving a same-size spacer so the dial stays centered", async () => {
      await mount();
      controls()?.dispatchEvent(new CustomEvent("start-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(clearButton()).toBeNull();
      expect(element.shadowRoot?.querySelector(".dial-side-spacer")).not.toBeNull();
    });

    it("shows the clear (X) button and unprimes the recipe when activated once a recipe is primed", async () => {
      primedRecipeSignal.value = primedRecipe();
      timerSecondsSignal.value = 30;
      await mount();

      expect(clearButton()).not.toBeNull();

      fireIconClick(clearButton());
      await element.updateComplete;

      expect(primedRecipeSignal.value).toBeNull();
      expect(timerSecondsSignal.value).toBe(0);
      // Back to the idle base stopwatch, so brew-timer-controls returns.
      expect(controls()).not.toBeNull();
    });

    it("shows a Play fab and 'Tap play to start...' hint while paused", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();

      expect(fab()?.getAttribute("aria-label")).toBe("Start");
      expect(dialHint()?.textContent?.trim()).toBe("Tap play to start your pour-over timer.");
    });

    it("toggles the timer running and shows a Pause fab and 'Brewing in progress' hint once running", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();

      fireIconClick(fab());
      await element.updateComplete;

      expect(timerRunningSignal.value).toBe(true);
      expect(fab()?.getAttribute("aria-label")).toBe("Pause");
      expect(dialHint()?.textContent?.trim()).toBe("Brewing in progress…");
    });

    it("swaps to a Stop/Seal fab with the recording hint when running and a device is connected", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();
      fireIconClick(fab());
      await element.updateComplete;
      scaleConnectionStateSignal.value = "connected";
      await element.updateComplete;

      expect(fab()?.getAttribute("aria-label")).toBe("Stop and seal");
      expect(dialHint()?.textContent?.trim()).toBe("Recording · Stop/Seal ends & saves this shot.");

      scaleConnectionStateSignal.value = "disconnected";
    });

    it("fires stopSession (not toggleTimer) from the Stop/Seal fab", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();
      fireIconClick(fab());
      await element.updateComplete;
      scaleConnectionStateSignal.value = "connected";
      await element.updateComplete;
      timerSecondsSignal.value = 12;

      fireIconClick(fab());
      await element.updateComplete;

      // stopSession pauses and seals telemetry, unlike toggleTimer's plain pause (which
      // wouldn't seal) - and, unlike resetTimer, leaves the elapsed time as-is.
      expect(timerRunningSignal.value).toBe(false);
      expect(telemetrySealedSignal.value).toBe(true);
      expect(timerSecondsSignal.value).toBe(12);

      scaleConnectionStateSignal.value = "disconnected";
    });

    it("still shows a Pause fab (not Stop/Seal) when running but no device is connected", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();

      fireIconClick(fab());
      await element.updateComplete;

      expect(fab()?.getAttribute("aria-label")).toBe("Pause");
      expect(dialHint()?.textContent?.trim()).toBe("Brewing in progress…");
    });
  });

  describe("dial", () => {
    it("is not counting down for a plain, unprimed stopwatch", async () => {
      await mount();

      expect(dial()?.countdown).toBe(false);
    });

    it("is counting down once a recipe with a target is primed in countdown mode", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      guidedModeSignal.value = "countdown";
      await mount();

      expect(dial()?.countdown).toBe(true);
    });

    it("is not counting down once switched to count-up mode", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      guidedModeSignal.value = "countup";
      await mount();

      expect(dial()?.countdown).toBe(false);
    });
  });

  describe("recipe panel", () => {
    it("does not render brew-timer-recipe-panel when unprimed", async () => {
      await mount();

      expect(recipePanel()).toBeNull();
    });

    it("renders brew-timer-recipe-panel with the primed recipe once one is set", async () => {
      const recipe = primedRecipe();
      primedRecipeSignal.value = recipe;
      await mount();

      expect(recipePanel()?.recipe).toEqual(recipe);
    });

    it("updates the guided mode when brew-timer-recipe-panel fires mode-change", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();

      recipePanel()?.dispatchEvent(
        new CustomEvent("mode-change", { detail: "countup", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(guidedModeSignal.value).toBe("countup");
    });

    it("updates the target seconds when brew-timer-recipe-panel fires target-change", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      await mount();

      recipePanel()?.dispatchEvent(
        new CustomEvent("target-change", { detail: "5", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(primedRecipeSignal.value?.targetSeconds).toBe(300);
    });

    it("ignores an invalid target-change value", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      await mount();

      recipePanel()?.dispatchEvent(
        new CustomEvent("target-change", { detail: "not a number", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(primedRecipeSignal.value?.targetSeconds).toBe(210);
    });
  });

  describe("active step banner", () => {
    const steps: IBrewStep[] = [{ id: "bloom", label: "Bloom", kind: "timed", seconds: 30 }];

    const banner = (): Element | null =>
      element.shadowRoot?.querySelector("brew-active-step-banner") ?? null;

    afterEach(() => {
      showActiveStepBannerSignal.value = true;
    });

    it("renders when a recipe with steps is primed and the timer is running", async () => {
      primedRecipeSignal.value = primedRecipe({ steps });
      timerRunningSignal.value = true;
      await mount();

      expect(banner()).not.toBeNull();
    });

    it("is absent when showActiveStepBannerSignal is false, even with a primed recipe with steps and a running timer", async () => {
      primedRecipeSignal.value = primedRecipe({ steps });
      timerRunningSignal.value = true;
      showActiveStepBannerSignal.value = false;
      await mount();

      expect(banner()).toBeNull();
    });
  });

  describe("saved brew picker", () => {
    it("opens the picker sheet when brew-timer-controls fires choose-saved-click", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      const sheet = element.shadowRoot?.querySelector("brew-saved-brew-picker-sheet") as
        | (HTMLElement & { open: boolean })
        | undefined;
      expect(sheet?.open).toBe(false);

      controls()?.dispatchEvent(
        new CustomEvent("choose-saved-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(sheet?.open).toBe(true);
    });

    it("primes the timer from the selected brew and closes the picker sheet on saved-brew-select", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      controls()?.dispatchEvent(
        new CustomEvent("choose-saved-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      const sheet = element.shadowRoot?.querySelector("brew-saved-brew-picker-sheet") as
        | (HTMLElement & { open: boolean })
        | undefined;
      expect(sheet?.open).toBe(true);

      const selectedBrew = makeSavedBrew({ id: 99, brewType: "Aeropress", name: "Trip brew" });
      sheet?.dispatchEvent(
        new CustomEvent<ISavedBrew>("saved-brew-select", {
          detail: selectedBrew,
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      expect(primedRecipeSignal.value?.name).toBe("Trip brew");
      expect(primedRecipeSignal.value?.brewType).toBe("Aeropress");
      expect(sheet?.open).toBe(false);
    });
  });

  describe("devices banner", () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "bluetooth");
      scaleConnectionStateSignal.value = "disconnected";
      monitorConnectionStateSignal.value = "disconnected";
      devicesBannerDismissedSignal.value = false;
      localStorage.removeItem("brewme-devices-banner-dismissed-forever");
    });

    it("is absent when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      await mount();

      expect(element.shadowRoot?.querySelector(".devices-banner")).toBeNull();
    });

    it("lists both devices when neither is connected", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      const rowLabels = Array.from(
        element.shadowRoot?.querySelectorAll(".devices-banner-row-label") ?? [],
      ).map((label) => label.textContent);
      expect(rowLabels).toContain("Bookoo Scale");
      expect(rowLabels).toContain("Espresso Monitor");
    });

    it("drops a device's row once it's connected, but keeps offering the other", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      scaleConnectionStateSignal.value = "connected";
      await mount();

      const rowLabels = Array.from(
        element.shadowRoot?.querySelectorAll(".devices-banner-row-label") ?? [],
      ).map((label) => label.textContent);
      expect(rowLabels).not.toContain("Bookoo Scale");
      expect(rowLabels).toContain("Espresso Monitor");
    });

    it("closes (but stays mounted, for the exit animation) once both devices are connected", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      scaleConnectionStateSignal.value = "connected";
      monitorConnectionStateSignal.value = "connected";
      await mount();

      expect(devicesBannerWrapper()).not.toBeNull();
      expect(devicesBannerWrapper()?.open).toBe(false);
    });

    it("dismisses on close and stays hidden even with devices still disconnected", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();
      expect(devicesBannerWrapper()?.open).toBe(true);

      const dismissButton = element.shadowRoot?.querySelector(
        ".devices-banner-header brew-icon-button",
      );
      dismissButton?.dispatchEvent(
        new CustomEvent("icon-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(devicesBannerWrapper()?.open).toBe(false);
      expect(devicesBannerDismissedSignal.value).toBe(true);
    });

    it('"Never show again" persists the dismissal to localStorage', async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      const neverShowButton = Array.from(
        element.shadowRoot?.querySelectorAll(".devices-banner-footer brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Never show again");
      neverShowButton?.dispatchEvent(
        new CustomEvent("button-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(devicesBannerWrapper()?.open).toBe(false);
      expect(devicesBannerDismissedSignal.value).toBe(true);
      expect(localStorage.getItem("brewme-devices-banner-dismissed-forever")).toBe("true");
    });
  });

  describe("extraction chart", () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "bluetooth");
    });

    it("is absent when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      await mount();

      expect(element.shadowRoot?.querySelector("brew-extraction-chart")).toBeNull();
    });

    it("renders even before any device has connected this session, once Web Bluetooth is supported", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      expect(element.shadowRoot?.querySelector("brew-extraction-chart")).not.toBeNull();
    });
  });

  describe("telemetry gating by brew type features", () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "bluetooth");
    });

    const statTiles = (): Element | null =>
      element.shadowRoot?.querySelector(".telemetry-row") ?? null;

    const chart = (): Element | null =>
      element.shadowRoot?.querySelector("brew-extraction-chart") ?? null;

    it("renders neither the stat tiles nor the extraction chart when the primed recipe's brew type resolves to telemetryMode 'off' (e.g. Aeropress)", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      primedRecipeSignal.value = primedRecipe({ brewType: "Aeropress" });
      await mount();

      expect(statTiles()).toBeNull();
      expect(chart()).toBeNull();
    });

    it("renders the extraction chart but not the stat tiles for telemetryMode 'chart-only'", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      brewTypeFeaturesSignal.value = {
        V60: { showShotsSection: true, telemetryMode: "chart-only" },
      };
      primedRecipeSignal.value = primedRecipe({ brewType: "V60" });
      await mount();

      expect(statTiles()).toBeNull();
      expect(chart()).not.toBeNull();
    });

    it("renders both the stat tiles and the extraction chart for telemetryMode 'full'", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      brewTypeFeaturesSignal.value = { V60: { showShotsSection: true, telemetryMode: "full" } };
      primedRecipeSignal.value = primedRecipe({ brewType: "V60" });
      await mount();

      expect(statTiles()).not.toBeNull();
      expect(chart()).not.toBeNull();
    });

    it("preserves old behavior (both render) for a null recipe (no brew type to restrict on)", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      primedRecipeSignal.value = null;
      await mount();

      expect(statTiles()).not.toBeNull();
      expect(chart()).not.toBeNull();
    });

    it("also hides the 'Connect your devices' banner for a locked brew type, so pairing isn't offered for telemetry that can never be shown or recorded", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      devicesBannerDismissedSignal.value = false;
      primedRecipeSignal.value = primedRecipe({ brewType: "Aeropress" });
      await mount();

      expect(element.shadowRoot?.querySelector(".devices-banner")).toBeNull();
    });

    it("still offers the devices banner for a brew type with telemetry enabled", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      devicesBannerDismissedSignal.value = false;
      primedRecipeSignal.value = primedRecipe({ brewType: "V60" });
      await mount();

      expect(element.shadowRoot?.querySelector(".devices-banner")).not.toBeNull();
    });
  });

  describe('"go to Settings" notice after Never show again', () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "bluetooth");
      scaleConnectionStateSignal.value = "disconnected";
      monitorConnectionStateSignal.value = "disconnected";
      devicesBannerDismissedSignal.value = false;
      localStorage.removeItem("brewme-devices-banner-dismissed-forever");
      vi.useRealTimers();
    });

    const clickNeverShowAgain = async (): Promise<void> => {
      const neverShowButton = Array.from(
        element.shadowRoot?.querySelectorAll(".devices-banner-footer brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Never show again");
      neverShowButton?.dispatchEvent(
        new CustomEvent("button-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;
    };

    it("shows a notice pointing to Settings once devices are permanently dismissed", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      await clickNeverShowAgain();

      expect(settingsNoticeWrapper()?.open).toBe(true);

      const settingsLink = Array.from(
        element.shadowRoot?.querySelectorAll("brew-button[href]") ?? [],
      ).find((button) => button.textContent?.trim() === "Go to Settings");
      expect(settingsLink?.getAttribute("href")).toBe("/more/settings");
    });

    it("auto-hides the notice after 5 seconds", async () => {
      vi.useFakeTimers();
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      await clickNeverShowAgain();
      expect(settingsNoticeWrapper()?.open).toBe(true);

      vi.advanceTimersByTime(5000);
      await element.updateComplete;

      expect(settingsNoticeWrapper()?.open).toBe(false);
    });

    it("dismisses early when its own close button is tapped", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      await clickNeverShowAgain();
      expect(settingsNoticeWrapper()?.open).toBe(true);

      const noticeHeader = Array.from(
        element.shadowRoot?.querySelectorAll(".devices-banner-header") ?? [],
      ).find((header) =>
        header.querySelector(".devices-banner-title")?.textContent?.includes("Settings"),
      );
      const dismissButton = noticeHeader?.querySelector("brew-icon-button");
      dismissButton?.dispatchEvent(
        new CustomEvent("icon-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(settingsNoticeWrapper()?.open).toBe(false);
    });
  });
});
