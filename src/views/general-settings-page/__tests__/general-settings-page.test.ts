import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  scrollToTimerSettingsSectionSignal,
  showActiveStepBannerSignal,
  timerCountStyleSignal,
} from "../../../shared/stores/timer-settings.store";
import "../general-settings-page";
import type { GeneralSettingsPage } from "../general-settings-page";

describe("general-settings-page", () => {
  let element: GeneralSettingsPage;

  beforeEach(async () => {
    timerCountStyleSignal.value = "countdown";
    showActiveStepBannerSignal.value = true;
    scrollToTimerSettingsSectionSignal.value = false;

    element = document.createElement("general-settings-page") as GeneralSettingsPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    timerCountStyleSignal.value = "countdown";
    showActiveStepBannerSignal.value = true;
    Reflect.deleteProperty(navigator, "bluetooth");
  });

  it("renders a top-bar back link to the Settings hub", () => {
    const topBar = element.shadowRoot?.querySelector("brew-top-bar");
    expect(topBar?.getAttribute("href")).toBe("/more/settings");
  });

  describe("Timer section", () => {
    const rowFor = (label: string): Element | undefined =>
      Array.from(element.shadowRoot?.querySelectorAll(".row") ?? []).find(
        (row) => row.querySelector(".row-label")?.textContent?.trim() === label,
      );

    const countStyleRow = (): Element | undefined => rowFor("Default count style");

    const bannerRow = (): Element | undefined => rowFor("Show large step banner");

    const switchIn = (row: Element | undefined): (Element & { checked: boolean }) | null =>
      (row?.querySelector("brew-switch") as (Element & { checked: boolean }) | null) ?? null;

    const chipIn = (
      row: Element | undefined,
      label: string,
    ): (Element & { selected: boolean }) | undefined =>
      Array.from(row?.querySelectorAll("brew-chip") ?? []).find(
        (chip) => chip.getAttribute("label") === label,
      ) as (Element & { selected: boolean }) | undefined;

    it("renders the Timer section title", () => {
      const sectionTitles = Array.from(
        element.shadowRoot?.querySelectorAll(".section-title") ?? [],
      );
      expect(sectionTitles.some((title) => title.textContent === "Timer")).toBe(true);
    });

    it("reflects the default timerCountStyleSignal value: Count down selected, Count up not", () => {
      const row = countStyleRow();

      expect(chipIn(row, "Count down")?.selected).toBe(true);
      expect(chipIn(row, "Count up")?.selected).toBe(false);
    });

    it("reflects the default showActiveStepBannerSignal value: switch checked", () => {
      expect(switchIn(bannerRow())?.checked).toBe(true);
    });

    it("calls setTimerCountStyle('countup') and re-renders the selected chip when Count up is clicked", async () => {
      chipIn(countStyleRow(), "Count up")?.dispatchEvent(
        new CustomEvent("chip-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(timerCountStyleSignal.value).toBe("countup");
      const updatedRow = countStyleRow();
      expect(chipIn(updatedRow, "Count up")?.selected).toBe(true);
      expect(chipIn(updatedRow, "Count down")?.selected).toBe(false);
    });

    it("calls setTimerCountStyle('countdown') and re-renders the selected chip when Count down is clicked", async () => {
      timerCountStyleSignal.value = "countup";
      element.requestUpdate();
      await element.updateComplete;

      chipIn(countStyleRow(), "Count down")?.dispatchEvent(
        new CustomEvent("chip-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(timerCountStyleSignal.value).toBe("countdown");
      const updatedRow = countStyleRow();
      expect(chipIn(updatedRow, "Count down")?.selected).toBe(true);
      expect(chipIn(updatedRow, "Count up")?.selected).toBe(false);
    });

    it("calls setShowActiveStepBanner and re-renders the switch checked when its change event fires", async () => {
      switchIn(bannerRow())?.dispatchEvent(
        new CustomEvent<boolean>("change", { detail: false, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(showActiveStepBannerSignal.value).toBe(false);
      expect(switchIn(bannerRow())?.checked).toBe(false);
    });
  });

  describe("scroll to Timer section on navigation", () => {
    /**
     * `_scrollToTimerSectionOnceSettled` polls via `requestAnimationFrame` for up to its
     * `maxFrames` (10) before forcing the scroll - waits out that full bounded chain (rather than
     * guessing how many frames happy-dom's always-0 `offsetTop` takes to "settle") so the internal
     * loop is guaranteed to have already called `scrollIntoView` by the time each test asserts,
     * and doesn't leave a straggling `requestAnimationFrame` callback to fire during a *later*
     * test's own spy window.
     */
    const waitForSettledScroll = async (frames = 12): Promise<void> => {
      for (let i = 0; i < frames; i += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    };

    afterEach(() => {
      scrollToTimerSettingsSectionSignal.value = false;
    });

    it("scrolls the Timer section into view and clears the pending request when mounted with one set", async () => {
      scrollToTimerSettingsSectionSignal.value = true;
      const scrollIntoViewSpy = vi
        .spyOn(HTMLElement.prototype, "scrollIntoView")
        .mockImplementation(() => {});

      const freshElement = document.createElement("general-settings-page") as GeneralSettingsPage;
      document.body.appendChild(freshElement);
      await freshElement.updateComplete;
      await waitForSettledScroll();

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
      expect(scrollToTimerSettingsSectionSignal.value).toBe(false);

      freshElement.remove();
      scrollIntoViewSpy.mockRestore();
    });

    it("does not scroll when mounted with no pending request", async () => {
      scrollToTimerSettingsSectionSignal.value = false;
      const scrollIntoViewSpy = vi
        .spyOn(HTMLElement.prototype, "scrollIntoView")
        .mockImplementation(() => {});

      const freshElement = document.createElement("general-settings-page") as GeneralSettingsPage;
      document.body.appendChild(freshElement);
      await freshElement.updateComplete;
      await waitForSettledScroll();

      expect(scrollIntoViewSpy).not.toHaveBeenCalled();

      freshElement.remove();
      scrollIntoViewSpy.mockRestore();
    });
  });

  describe("Connected devices section", () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "bluetooth");
    });

    it("is absent when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      element.requestUpdate();
      await element.updateComplete;

      const sectionTitles = Array.from(
        element.shadowRoot?.querySelectorAll(".section-title") ?? [],
      );
      expect(sectionTitles.some((title) => title.textContent === "Connected devices")).toBe(false);
      expect(element.shadowRoot?.querySelector("brew-device-connect-rows")).toBeNull();
    });

    it("shows the device connect rows when Web Bluetooth is supported", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      element.requestUpdate();
      await element.updateComplete;

      const sectionTitles = Array.from(
        element.shadowRoot?.querySelectorAll(".section-title") ?? [],
      );
      expect(sectionTitles.some((title) => title.textContent === "Connected devices")).toBe(true);
      expect(element.shadowRoot?.querySelector("brew-device-connect-rows")).not.toBeNull();
    });
  });
});
