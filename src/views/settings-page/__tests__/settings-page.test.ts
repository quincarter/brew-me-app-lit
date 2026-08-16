import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BREW_TYPES } from "../../../shared/data/brew-content.data";
import {
  brewTypeFeaturesSignal,
  getBrewTypeFeatures,
} from "../../../shared/stores/brew-type-features.store";
import {
  addCustomBrewType,
  deleteAllCustomBrewTypes,
} from "../../../shared/stores/brew-types.store";
import { deleteAllSavedBrews } from "../../../shared/stores/brew.store";
import { exportAppData, importAppData } from "../../../shared/utilities/export-data.utility";
import "../settings-page";
import type { SettingsPage } from "../settings-page";

vi.mock("../../../shared/utilities/export-data.utility", () => ({
  exportAppData: vi.fn(),
  importAppData: vi.fn(),
}));

describe("settings-page", () => {
  let element: SettingsPage;
  let reloadSpy: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(async () => {
    deleteAllSavedBrews();
    deleteAllCustomBrewTypes();
    brewTypeFeaturesSignal.value = {};
    vi.mocked(exportAppData).mockReset();
    vi.mocked(importAppData).mockReset();

    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    });

    element = document.createElement("settings-page") as SettingsPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  const exportButton = (): Element | undefined =>
    Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.trim() === "Export data",
    );

  const clickExportButton = (): void => {
    const inner = exportButton()?.shadowRoot?.querySelector("button");
    inner?.click();
  };

  const importButton = (): Element | undefined =>
    Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.trim() === "Import data",
    );

  const clickImportButton = (): void => {
    const inner = importButton()?.shadowRoot?.querySelector("button");
    inner?.click();
  };

  const fileInput = (): HTMLInputElement | null | undefined =>
    element.shadowRoot?.querySelector("input[type='file']");

  const selectImportFile = async (file: File | undefined): Promise<void> => {
    const input = fileInput();
    if (!input) throw new Error("file input not found");
    Object.defineProperty(input, "files", {
      configurable: true,
      value: file ? [file] : [],
    });
    input.dispatchEvent(new Event("change"));
    await element.updateComplete;
  };

  const importConfirmActions = (): Element | undefined =>
    Array.from(element.shadowRoot?.querySelectorAll(".add-actions") ?? []).find((actions) =>
      Array.from(actions.querySelectorAll("brew-button")).some(
        (button) => button.textContent?.trim() === "Yes, import and replace",
      ),
    );

  const confirmImportButton = (): Element | undefined =>
    Array.from(importConfirmActions()?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.trim() === "Yes, import and replace",
    );

  const cancelImportButton = (): Element | undefined =>
    Array.from(importConfirmActions()?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.trim() === "Cancel",
    );

  const clickButton = (button: Element | undefined): void => {
    const inner = button?.shadowRoot?.querySelector("button");
    inner?.click();
  };

  it("renders an Export data button in the Data section", () => {
    expect(exportButton()).not.toBeUndefined();
  });

  it("calls exportAppData when the Export data button is clicked", async () => {
    vi.mocked(exportAppData).mockResolvedValue(undefined);

    clickExportButton();
    await element.updateComplete;

    expect(exportAppData).toHaveBeenCalledTimes(1);
  });

  it("shows 'Exported!' status text after a successful export", async () => {
    vi.mocked(exportAppData).mockResolvedValue(undefined);

    clickExportButton();
    await vi.waitUntil(
      () => element.shadowRoot?.querySelector(".status-text")?.textContent?.trim() === "Exported!",
    );

    expect(element.shadowRoot?.querySelector(".status-text")?.textContent?.trim()).toBe(
      "Exported!",
    );
  });

  it("clears the status text after 2500ms", async () => {
    vi.useFakeTimers();
    vi.mocked(exportAppData).mockResolvedValue(undefined);

    clickExportButton();
    await vi.advanceTimersByTimeAsync(0);
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector(".status-text")?.textContent?.trim()).toBe(
      "Exported!",
    );

    await vi.advanceTimersByTimeAsync(2500);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".status-text")).toBeNull();
  });

  it("shows the failure status text when exportAppData rejects", async () => {
    vi.mocked(exportAppData).mockRejectedValue(new Error("nope"));

    clickExportButton();
    await vi.waitUntil(
      () =>
        element.shadowRoot?.querySelector(".status-text")?.textContent?.trim() ===
        "Couldn't export — try again.",
    );

    expect(element.shadowRoot?.querySelector(".status-text")?.textContent?.trim()).toBe(
      "Couldn't export — try again.",
    );
  });

  it("renders an Import data button in the Data section", () => {
    expect(importButton()).not.toBeUndefined();
  });

  it("clicking Import data triggers the hidden file input", () => {
    const input = fileInput();
    expect(input).not.toBeNull();
    const clickSpy = vi.spyOn(input as HTMLInputElement, "click");

    clickImportButton();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("selecting a file shows the confirm block with the picked file's name", async () => {
    const file = new File(["{}"], "my-export.json", { type: "application/json" });

    await selectImportFile(file);

    const hint = Array.from(element.shadowRoot?.querySelectorAll(".section-hint") ?? []).find((p) =>
      p.textContent?.includes("my-export.json"),
    );
    expect(hint).not.toBeUndefined();
    expect(confirmImportButton()).not.toBeUndefined();
    expect(cancelImportButton()).not.toBeUndefined();
  });

  it("does not show the confirm block when no file was picked", async () => {
    await selectImportFile(undefined);

    expect(confirmImportButton()).toBeUndefined();
  });

  it("resets the file input's value after a file is selected", async () => {
    const file = new File(["{}"], "my-export.json", { type: "application/json" });

    await selectImportFile(file);

    expect(fileInput()?.value).toBe("");
  });

  it("clicking Cancel dismisses the confirm block without calling importAppData", async () => {
    const file = new File(["{}"], "my-export.json", { type: "application/json" });
    await selectImportFile(file);

    clickButton(cancelImportButton());
    await element.updateComplete;

    expect(confirmImportButton()).toBeUndefined();
    expect(importAppData).not.toHaveBeenCalled();
  });

  it("clicking confirm calls importAppData with the picked file", async () => {
    vi.mocked(importAppData).mockResolvedValue(undefined);
    const file = new File(["{}"], "my-export.json", { type: "application/json" });
    await selectImportFile(file);

    clickButton(confirmImportButton());
    await element.updateComplete;

    expect(importAppData).toHaveBeenCalledWith(file);
  });

  it("shows 'Imported! Reloading…' and reloads the page after a successful import", async () => {
    vi.mocked(importAppData).mockResolvedValue(undefined);
    const file = new File(["{}"], "my-export.json", { type: "application/json" });
    await selectImportFile(file);

    clickButton(confirmImportButton());
    await vi.waitUntil(
      () =>
        element.shadowRoot?.querySelector(".status-text")?.textContent?.trim() ===
        "Imported! Reloading…",
    );

    expect(element.shadowRoot?.querySelector(".status-text")?.textContent?.trim()).toBe(
      "Imported! Reloading…",
    );
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("shows the failure status text and resets the confirm state when importAppData rejects", async () => {
    vi.mocked(importAppData).mockRejectedValue(new Error("bad file"));
    const file = new File(["{}"], "my-export.json", { type: "application/json" });
    await selectImportFile(file);

    clickButton(confirmImportButton());
    await vi.waitUntil(
      () =>
        element.shadowRoot?.querySelector(".status-text")?.textContent?.trim() ===
        "Couldn't import — check the file and try again.",
    );

    expect(element.shadowRoot?.querySelector(".status-text")?.textContent?.trim()).toBe(
      "Couldn't import — check the file and try again.",
    );
    expect(confirmImportButton()).toBeUndefined();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  describe("Brew type features section", () => {
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
