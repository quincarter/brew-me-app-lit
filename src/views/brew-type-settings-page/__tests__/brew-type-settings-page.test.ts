import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BREW_TYPES } from "../../../shared/data/brew-content.data";
import {
  brewTypeFeaturesSignal,
  getBrewTypeFeatures,
} from "../../../shared/stores/brew-type-features.store";
import {
  deleteAllCustomBrewTypes,
  addCustomBrewType,
} from "../../../shared/stores/brew-types.store";
import "../brew-type-settings-page";
import type { BrewTypeSettingsPage } from "../brew-type-settings-page";

describe("brew-type-settings-page", () => {
  let element: BrewTypeSettingsPage;

  beforeEach(async () => {
    deleteAllCustomBrewTypes();
    brewTypeFeaturesSignal.value = {};

    element = document.createElement("brew-type-settings-page") as BrewTypeSettingsPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders a top-bar back link to the Settings hub", () => {
    const topBar = element.shadowRoot?.querySelector("brew-top-bar");
    expect(topBar?.getAttribute("href")).toBe("/more/settings");
  });

  describe("Brew type features section", () => {
    beforeEach(async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      element.requestUpdate();
      await element.updateComplete;
    });

    afterEach(() => {
      Reflect.deleteProperty(navigator, "bluetooth");
    });

    const featureRowFor = (name: string): Element | undefined =>
      Array.from(element.shadowRoot?.querySelectorAll(".feature-row") ?? []).find(
        (row) => row.querySelector(".row-label")?.textContent?.trim() === name,
      );

    const switchIn = (row: Element | undefined): (Element & { checked: boolean }) | null =>
      (row?.querySelector("brew-switch") as (Element & { checked: boolean }) | null) ?? null;

    const chipIn = (
      row: Element | undefined,
      label: string,
    ): (Element & { selected: boolean }) | undefined =>
      Array.from(row?.querySelectorAll("brew-chip") ?? []).find(
        (chip) => chip.getAttribute("label") === label,
      ) as (Element & { selected: boolean }) | undefined;

    it("renders one feature row per built-in brew type", () => {
      const rows = element.shadowRoot?.querySelectorAll(".feature-row");
      expect(rows?.length).toBe(BREW_TYPES.length);
    });

    it("renders a feature row for a newly-added custom brew type too", async () => {
      addCustomBrewType("Siphon");
      element.requestUpdate();
      await element.updateComplete;

      expect(featureRowFor("Siphon")).not.toBeUndefined();
    });

    it("reflects the default features for an unlocked brew type: shots switch on, telemetry mode 'full' selected", () => {
      const row = featureRowFor("V60");

      expect(switchIn(row)?.checked).toBe(true);
      expect(chipIn(row, "Gauges + chart")?.selected).toBe(true);
      expect(chipIn(row, "Off")?.selected).toBe(false);
      expect(chipIn(row, "Chart only")?.selected).toBe(false);
    });

    it("calls setShowShotsSection and re-renders the switch checked when its change event fires", async () => {
      const row = featureRowFor("V60");
      switchIn(row)?.dispatchEvent(
        new CustomEvent<boolean>("change", { detail: false, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(getBrewTypeFeatures("V60").showShotsSection).toBe(false);
      expect(switchIn(featureRowFor("V60"))?.checked).toBe(false);
    });

    it("calls setTelemetryMode and re-renders the selected chip when a telemetry chip-click fires", async () => {
      const row = featureRowFor("Chemex");
      chipIn(row, "Off")?.dispatchEvent(
        new CustomEvent("chip-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(getBrewTypeFeatures("Chemex").telemetryMode).toBe("off");
      const updatedRow = featureRowFor("Chemex");
      expect(chipIn(updatedRow, "Off")?.selected).toBe(true);
      expect(chipIn(updatedRow, "Gauges + chart")?.selected).toBe(false);
    });

    it("renders the Aeropress row locked: disabled switch/chips, locked-off values, and a hint", () => {
      const row = featureRowFor("Aeropress");

      expect(switchIn(row)?.hasAttribute("disabled")).toBe(true);
      expect(switchIn(row)?.checked).toBe(false);
      expect(chipIn(row, "Off")?.selected).toBe(true);
      expect(chipIn(row, "Off")?.hasAttribute("disabled")).toBe(true);
      expect(chipIn(row, "Gauges + chart")?.hasAttribute("disabled")).toBe(true);
      expect(chipIn(row, "Chart only")?.hasAttribute("disabled")).toBe(true);
      expect(row?.querySelector(".section-hint")?.textContent?.trim()).toBe(
        "Telemetry can't be tracked for Aeropress yet.",
      );
    });

    it("renders no hint for an unlocked brew type", () => {
      const row = featureRowFor("V60");

      expect(row?.querySelector(".section-hint")).toBeNull();
    });

    it("is absent when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      element.requestUpdate();
      await element.updateComplete;

      const sectionTitles = Array.from(
        element.shadowRoot?.querySelectorAll(".section-title") ?? [],
      );
      expect(sectionTitles.some((title) => title.textContent === "Brew type features")).toBe(false);
      expect(element.shadowRoot?.querySelectorAll(".feature-row").length).toBe(0);
    });
  });
});
