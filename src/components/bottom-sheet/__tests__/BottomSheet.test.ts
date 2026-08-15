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
    // The real `dialog.close()` is now deferred behind `_beginClosing()`'s
    // exit-transition wait (see `BottomSheet.ts`), so it isn't done yet
    // after a single `updateComplete` - poll for it instead of asserting
    // synchronously, with a timeout so a genuine regression (dialog never
    // closes) still fails fast rather than hanging.
    await vi.waitFor(() => expect(dialog.open).toBe(false), { timeout: 1000 });
  });

  /**
   * Stubs `dialog.getAnimations()` to return a single fake `Animation` whose
   * `playState`/`pending` are externally controllable. `happy-dom` doesn't
   * implement `getAnimations()` at all, so `_beginClosing()`'s
   * `_waitForExitTransition()` poll loop (and the genuine wait it performs
   * in a real browser) never exercises otherwise - stubbing it is the only
   * way to deterministically pause `_beginClosing()` mid-flight and inspect
   * the "closing but not yet closed" window the fix introduces. Starts
   * `"running"` (i.e. the exit transition is in flight); the returned
   * `finishAnimation` flips it to `"finished"`, which the poll loop picks
   * up on its next tick.
   */
  const stubPendingAnimation = (dialog: HTMLDialogElement): { finishAnimation: () => void } => {
    const animation: { playState: string; pending: boolean } = {
      playState: "running",
      pending: false,
    };
    dialog.getAnimations = vi.fn().mockReturnValue([animation]);
    return {
      finishAnimation: () => {
        animation.playState = "finished";
      },
    };
  };

  it("applies the closing class to the dialog while the deferred close is pending, and only closes for real once the exit animation finishes", async () => {
    vi.useFakeTimers();
    try {
      element.open = true;
      await element.updateComplete;
      const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
      expect(dialog.classList.contains("closing")).toBe(false);

      const { finishAnimation } = stubPendingAnimation(dialog);
      element.open = false;
      await element.updateComplete;
      // `_beginClosing()` flips `_closing` to `true` from inside `updated()`,
      // i.e. after that same pass's `render()` already ran - it takes a
      // follow-up update cycle for the `closing` class to actually land in
      // the rendered DOM.
      await element.updateComplete;

      // `_beginClosing()` is now polling the stubbed animation's
      // `playState` - the dialog is still open, but visually driven to its
      // closed appearance purely via the `closing` class (see
      // `bottom-sheet.styles.ts`).
      expect(dialog.classList.contains("closing")).toBe(true);
      expect(dialog.open).toBe(true);

      finishAnimation();
      // One poll tick is enough for `_waitForExitTransition()` to see the
      // animation is no longer running and resolve.
      await vi.advanceTimersByTimeAsync(30);
      // `_beginClosing()`'s post-wait `this._closing = false` schedules its
      // own Lit update cycle, separate from the native `dialog.close()` call
      // right below it - wait for it before checking the rendered class.
      await element.updateComplete;
      expect(dialog.open).toBe(false);
      // Once the deferred close actually runs, `_closing` resets to false.
      expect(dialog.classList.contains("closing")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaves the dialog open if open flips back to true before the pending exit animation finishes", async () => {
    vi.useFakeTimers();
    try {
      element.open = true;
      await element.updateComplete;
      const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;

      const { finishAnimation } = stubPendingAnimation(dialog);
      element.open = false;
      await element.updateComplete;
      // See the previous test for why a second update cycle is needed
      // before the `closing` class actually lands in the rendered DOM.
      await element.updateComplete;
      expect(dialog.classList.contains("closing")).toBe(true);

      // Reopen before the pending exit animation resolves - e.g. the user
      // taps back into the sheet mid-close. `_closing` resets to `false`
      // inside `updated()`, i.e. after that same pass's `render()` already
      // ran, so (as with the `closing` class being applied) it takes a
      // follow-up update cycle to actually clear from the rendered DOM.
      element.open = true;
      await element.updateComplete;
      await element.updateComplete;
      expect(dialog.classList.contains("closing")).toBe(false);
      expect(dialog.open).toBe(true);

      // Let the still-pending `_waitForExitTransition()` poll loop from the
      // aborted close resolve (whether or not the animation ever
      // "finishes") and flush `_beginClosing()`'s subsequent `!this.open`
      // guard check - it should see `open` is back to `true` and leave the
      // dialog alone rather than closing it out from under the reopen.
      finishAnimation();
      await vi.advanceTimersByTimeAsync(30);
      expect(dialog.open).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes the dialog once MAX_CLOSE_WAIT_MS elapses even if the exit animation never stops reporting as running", async () => {
    vi.useFakeTimers();
    try {
      element.open = true;
      await element.updateComplete;
      const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;

      // No `finishAnimation()` call here - the stubbed animation stays
      // `"running"` for the entirety of the test, simulating a
      // stuck/never-settling transition. `_waitForExitTransition()`'s hard
      // cap (`MAX_CLOSE_WAIT_MS`) is the only thing that should let the
      // close proceed rather than hanging forever.
      stubPendingAnimation(dialog);
      element.open = false;
      await element.updateComplete;
      // See the earlier tests for why a second update cycle is needed
      // before the `closing` class actually lands in the rendered DOM.
      await element.updateComplete;
      expect(dialog.classList.contains("closing")).toBe(true);
      expect(dialog.open).toBe(true);

      // Advance well past the 1000ms cap.
      await vi.advanceTimersByTimeAsync(1100);
      await element.updateComplete;
      expect(dialog.open).toBe(false);
      expect(dialog.classList.contains("closing")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
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
