import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import { resetCalculator, setWater } from "../../../shared/stores/calculator.store";
import {
  cancelSaveDialog,
  openSaveDialog,
  pendingBrewIconSignal,
  saveDialogOpenSignal,
  selectPendingBrewType,
} from "../../../shared/stores/save-dialog.store";
import type { ISavedBrew } from "../../../shared/interfaces/brew.interface";
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

  it("keeps the bottom sheet mounted but closed so its exit animation can play", () => {
    expect(saveDialogOpenSignal.value).toBe(false);
    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet).not.toBeNull();
    expect(sheet?.hasAttribute("open")).toBe(false);
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

  it("closes the sheet when Escape triggers the nested dialog's cancel event", async () => {
    openSaveDialog();
    await element.updateComplete;

    const dialog = element.shadowRoot
      ?.querySelector("brew-bottom-sheet")
      ?.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

    expect(saveDialogOpenSignal.value).toBe(false);
  });

  it("renders the open brew-bottom-sheet with a matching aria-label in its nested shadow root", async () => {
    openSaveDialog();
    await element.updateComplete;

    const bottomSheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(bottomSheet).not.toBeNull();
    expect(bottomSheet?.hasAttribute("open")).toBe(true);

    const sheet = bottomSheet?.shadowRoot?.querySelector(".sheet");
    expect(sheet).not.toBeNull();
    expect(sheet?.getAttribute("aria-label")).toBe("Name this brew");
  });

  it("renders share-mode copy when opened with intent 'share'", async () => {
    openSaveDialog({ intent: "share" });
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".title")?.textContent?.trim()).toBe(
      "Name this brew to share it",
    );
    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    expect(confirmButton?.textContent?.trim()).toBe("Save & Share");
  });

  it("renders guided-timer-mode copy when opened with intent 'guided-timer'", async () => {
    openSaveDialog({ intent: "guided-timer" });
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".title")?.textContent?.trim()).toBe(
      "Name this brew to start your guided brew",
    );
    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    expect(confirmButton?.textContent?.trim()).toBe("Save & Start Timer");
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

  const clickConfirmButton = (): void => {
    const confirmButton = element.shadowRoot?.querySelectorAll(".actions brew-button")[1];
    const innerButton = confirmButton?.shadowRoot?.querySelector("button");
    innerButton?.click();
  };

  it("dispatches brew-saved with the saved brew after a plain save confirm", async () => {
    setWater("480");
    openSaveDialog();
    selectPendingBrewType("Aeropress");
    await element.updateComplete;

    const savedEvent = new Promise<CustomEvent<ISavedBrew>>((resolve) => {
      element.addEventListener("brew-saved", (event) => resolve(event as CustomEvent<ISavedBrew>));
    });

    clickConfirmButton();

    const event = await savedEvent;
    expect(event.detail).toEqual(savedBrewsSignal.value[0]);
  });

  it("dispatches brew-share-outcome after a successful save-and-share confirm", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });

    setWater("480");
    openSaveDialog({ intent: "share" });
    selectPendingBrewType("Aeropress");
    await element.updateComplete;

    const outcomeEvent = new Promise<CustomEvent<ShareOutcome>>((resolve) => {
      element.addEventListener("brew-share-outcome", (event) =>
        resolve(event as CustomEvent<ShareOutcome>),
      );
    });

    clickConfirmButton();

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

    clickConfirmButton();
    await element.updateComplete;

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("dispatches brew-guided-timer-ready with the saved brew when confirming in guided-timer mode", async () => {
    setWater("480");
    openSaveDialog({ intent: "guided-timer" });
    selectPendingBrewType("Aeropress");
    await element.updateComplete;

    const readyEvent = new Promise<CustomEvent<ISavedBrew>>((resolve) => {
      element.addEventListener("brew-guided-timer-ready", (event) =>
        resolve(event as CustomEvent<ISavedBrew>),
      );
    });
    const dispatchSpy = vi.fn();
    element.addEventListener("brew-saved", dispatchSpy);
    element.addEventListener("brew-share-outcome", dispatchSpy);

    clickConfirmButton();

    const event = await readyEvent;
    expect(event.detail).toEqual(savedBrewsSignal.value[0]);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
