import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../brew-bottom-sheet";
import type { BottomSheet } from "../BottomSheet";

/** Stubs a deterministic box for the dialog so click-outside/inside checks don't depend on happy-dom's (always-zero) layout engine. */
const stubDialogRect = (dialog: HTMLDialogElement): void => {
  dialog.getBoundingClientRect = () =>
    ({
      top: 100,
      left: 100,
      right: 300,
      bottom: 300,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    }) as DOMRect;
};

describe("brew-bottom-sheet", () => {
  let element: BottomSheet;

  beforeEach(async () => {
    element = document.createElement("brew-bottom-sheet") as BottomSheet;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders a closed native dialog when open is false", () => {
    expect(element.open).toBe(false);
    const dialog = element.shadowRoot?.querySelector("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog?.open).toBe(false);
  });

  it("opens the native dialog as a modal with the given aria-label when open", async () => {
    element.open = true;
    element.label = "Name this brew";
    await element.updateComplete;

    const dialog = element.shadowRoot?.querySelector("dialog");
    expect(dialog?.open).toBe(true);
    expect(dialog?.getAttribute("aria-label")).toBe("Name this brew");
  });

  it("closes the native dialog when open flips back to false", async () => {
    element.open = true;
    await element.updateComplete;
    const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    element.open = false;
    await element.updateComplete;
    expect(dialog.open).toBe(false);
  });

  it("renders slotted content inside the dialog", async () => {
    const child = document.createElement("span");
    child.textContent = "Sheet content";
    element.appendChild(child);
    element.open = true;
    await element.updateComplete;

    const dialog = element.shadowRoot?.querySelector("dialog");
    const slot = dialog?.querySelector("slot");
    expect(slot).not.toBeNull();
    expect(slot?.assignedElements()).toContain(child);
  });

  it("dispatches sheet-scrim-click when a click lands outside the dialog's box", async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    stubDialogRect(dialog);

    const dispatchSpy = vi.fn();
    element.addEventListener("sheet-scrim-click", dispatchSpy);

    dialog.dispatchEvent(new MouseEvent("click", { clientX: 10, clientY: 10 }));

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch sheet-scrim-click when a click lands inside the dialog's box", async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    stubDialogRect(dialog);

    const dispatchSpy = vi.fn();
    element.addEventListener("sheet-scrim-click", dispatchSpy);

    dialog.dispatchEvent(new MouseEvent("click", { clientX: 200, clientY: 200 }));

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("dispatches sheet-scrim-click and prevents the default close when Escape triggers cancel", async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    const dispatchSpy = vi.fn();
    element.addEventListener("sheet-scrim-click", dispatchSpy);

    const cancelEvent = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it("dispatches sheet-scrim-click when native dialog close event fires while open", async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    const dispatchSpy = vi.fn();
    element.addEventListener("sheet-scrim-click", dispatchSpy);

    dialog.dispatchEvent(new Event("close"));

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
});
