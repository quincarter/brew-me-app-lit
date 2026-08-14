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

  it("reads the dialog's box before a bubble-phase handler on the click's own content can shrink it - the capture-phase fix", async () => {
    // Regression guard for the capture-vs-bubble fix described in
    // `_onDialogClick`'s doc comment: a click on slotted content (e.g. a
    // mode toggle) can synchronously shrink/reposition the dialog as its own
    // *bubble*-phase handler runs. If `_onDialogClick` were also bubble-phase,
    // it would run *after* that content handler and read the already-shrunk
    // box; registered at *capture* phase (as it is), it always runs first.
    //
    // This is reproduced directly (not via Lit's real shadow-DOM slotting,
    // which happy-dom doesn't propagate capture listeners across correctly)
    // by appending a plain child into the dialog with its own BUBBLE-phase
    // click listener that mutates the stubbed rect, then dispatching the
    // click on that child. A click at coordinates inside the ORIGINAL rect
    // but outside the shrunk one only stays "inside" if `_onDialogClick`'s
    // read happens before the child's handler runs - i.e. only with the
    // capture-phase registration this test guards. Reverting `BottomSheet.ts`
    // to a plain bubble-phase `@click` binding makes this test fail.
    element.open = true;
    await element.updateComplete;

    const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    const originalRect = {
      top: 100,
      left: 100,
      right: 300,
      bottom: 300,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    } as DOMRect;
    const shrunkRect = {
      top: 400,
      left: 400,
      right: 500,
      bottom: 500,
      x: 400,
      y: 400,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    } as DOMRect;
    const rectSpy = vi.fn().mockReturnValue(originalRect);
    dialog.getBoundingClientRect = rectSpy;

    const content = document.createElement("button");
    dialog.appendChild(content);
    // Bubble-phase, like a real toggle button's own click handler - fires
    // after any capture-phase listener on an ancestor, before any bubble-
    // phase listener on an ancestor (i.e. exactly where `_onDialogClick`
    // would run if it were still bubble-phase instead of capture-phase).
    content.addEventListener("click", () => {
      rectSpy.mockReturnValue(shrunkRect);
    });

    const dispatchSpy = vi.fn();
    element.addEventListener("sheet-scrim-click", dispatchSpy);

    // Inside the ORIGINAL rect, outside the post-mutation shrunk rect.
    content.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 150, clientY: 150 }));

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
