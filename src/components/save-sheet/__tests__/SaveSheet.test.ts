import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAllSavedBrews } from "../../../shared/stores/brew.store";
import { resetCalculator, setWater } from "../../../shared/stores/calculator.store";
import {
  cancelSaveDialog,
  openSaveDialog,
  pendingBrewIconSignal,
  saveDialogOpenSignal,
  selectPendingBrewType,
} from "../../../shared/stores/save-dialog.store";
import type { ShareOutcome } from "../../../shared/utilities/share.utility";
import "../brew-save-sheet";
import type { SaveSheet } from "../SaveSheet";

describe("brew-save-sheet", () => {
  let element: SaveSheet;

  beforeEach(async () => {
    resetCalculator();
    deleteAllSavedBrews();
    cancelSaveDialog();
    element = document.createElement("brew-save-sheet") as SaveSheet;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders nothing when the dialog is closed", () => {
    expect(saveDialogOpenSignal.value).toBe(false);
    expect(element.shadowRoot?.querySelector(".scrim")).toBeNull();
  });

  it("renders the name field, type picker, and non-share copy when opened normally", async () => {
    openSaveDialog();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".title")?.textContent?.trim()).toBe("Name this brew");
    expect(element.shadowRoot?.querySelector("brew-text-field")).not.toBeNull();
    expect(element.shadowRoot?.querySelector("brew-type-picker")).not.toBeNull();

    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    expect(confirmButton?.textContent?.trim()).toBe("Save");
  });

  it("renders share-mode copy when opened with shareAfterSave", async () => {
    openSaveDialog({ shareAfterSave: true });
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".title")?.textContent?.trim()).toBe(
      "Name this brew to share it",
    );
    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    expect(confirmButton?.textContent?.trim()).toBe("Save & Share");
  });

  it("disables the confirm button until a brew type is selected", async () => {
    openSaveDialog();
    await element.updateComplete;

    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    expect(confirmButton?.hasAttribute("disabled")).toBe(true);

    selectPendingBrewType("Aeropress");
    await element.updateComplete;

    expect(confirmButton?.hasAttribute("disabled")).toBe(false);
  });

  it("does not render the icon picker for a brew type with an automatic icon match", async () => {
    openSaveDialog();
    selectPendingBrewType("V60");
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-icon-picker")).toBeNull();
  });

  it("renders the icon picker for a custom brew type with no automatic icon match", async () => {
    openSaveDialog();
    selectPendingBrewType("My Weird Method");
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-icon-picker")).not.toBeNull();
  });

  it("updates pendingBrewIconSignal when an icon is picked in the icon picker", async () => {
    openSaveDialog();
    selectPendingBrewType("My Weird Method");
    await element.updateComplete;

    const iconPicker = element.shadowRoot?.querySelector("brew-icon-picker");
    iconPicker?.dispatchEvent(
      new CustomEvent<string>("icon-select", { detail: "chemex", bubbles: true, composed: true }),
    );
    await element.updateComplete;

    expect(pendingBrewIconSignal.value).toBe("chemex");
  });

  it("dispatches brew-share-outcome after a successful save-and-share confirm", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });

    setWater("480");
    openSaveDialog({ shareAfterSave: true });
    selectPendingBrewType("Aeropress");
    await element.updateComplete;

    const outcomeEvent = new Promise<CustomEvent<ShareOutcome>>((resolve) => {
      element.addEventListener("brew-share-outcome", (event) =>
        resolve(event as CustomEvent<ShareOutcome>),
      );
    });

    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    const innerButton = confirmButton?.shadowRoot?.querySelector("button");
    innerButton?.click();

    const event = await outcomeEvent;
    expect(event.detail).toBe("copied");
    expect(writeText).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("does not dispatch brew-share-outcome when confirming outside share mode", async () => {
    setWater("480");
    openSaveDialog();
    selectPendingBrewType("Aeropress");
    await element.updateComplete;

    const dispatchSpy = vi.fn();
    element.addEventListener("brew-share-outcome", dispatchSpy);

    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    const innerButton = confirmButton?.shadowRoot?.querySelector("button");
    innerButton?.click();
    await element.updateComplete;

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
