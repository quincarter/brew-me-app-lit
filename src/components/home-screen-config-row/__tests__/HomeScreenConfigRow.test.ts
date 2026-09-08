import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../brew-home-screen-config-row";
import type { HomeScreenConfigRow } from "../HomeScreenConfigRow";

describe("brew-home-screen-config-row", () => {
  let element: HomeScreenConfigRow;

  beforeEach(async () => {
    element = document.createElement("brew-home-screen-config-row") as HomeScreenConfigRow;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the title and description", async () => {
    element.title = "Stats";
    element.description = "Saved brew count and day streak";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".headline")?.textContent).toBe("Stats");
    expect(element.shadowRoot?.querySelector(".supporting")?.textContent).toBe(
      "Saved brew count and day streak",
    );
  });

  it("renders no supporting text element when description is unset", async () => {
    expect(element.shadowRoot?.querySelector(".supporting")).toBeNull();
  });

  it("defaults visible to false, not true", () => {
    // Regression guard: `?visible="${entry.visible}"` (a boolean-attribute
    // binding) never writes `visible="false"` on a freshly created element -
    // it just never sets the attribute at all for a falsy value. If this
    // property's own default were `true`, a fresh row for an
    // already-hidden section would silently render as visible, exactly the
    // "hide a section, navigate away and back, it's on again" bug this
    // guards against. The default must match what "no attribute" means,
    // the same way `brew-switch`'s `checked` defaults to `false`.
    const fresh = document.createElement("brew-home-screen-config-row") as HomeScreenConfigRow;
    expect(fresh.visible).toBe(false);
  });

  it("reflects the visible property onto the switch", async () => {
    element.visible = false;
    await element.updateComplete;

    const toggle = element.shadowRoot?.querySelector("brew-switch") as HTMLElement & {
      checked: boolean;
    };
    expect(toggle.checked).toBe(false);
  });

  it("fires visibility-change with the switch's new state", async () => {
    const listener = vi.fn();
    element.addEventListener("visibility-change", listener);

    const toggle = element.shadowRoot?.querySelector("brew-switch");
    toggle?.dispatchEvent(
      new CustomEvent("change", { detail: false, bubbles: true, composed: true }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent<boolean>).detail).toBe(false);
  });

  it("renders a drag handle", () => {
    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    expect(handle).not.toBeNull();
  });

  it("reflects the dragging property as a class on the row", async () => {
    element.dragging = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".row")?.classList.contains("dragging")).toBe(true);
  });

  it("fires reorder-pointerdown with the original PointerEvent when the drag handle receives a pointerdown", () => {
    const listener = vi.fn();
    element.addEventListener("reorder-pointerdown", listener);

    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    handle?.dispatchEvent(
      new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent<PointerEvent>).detail).toBeInstanceOf(
      PointerEvent,
    );
  });

  it("fires reorder-pointermove with the pointer's client coordinates", () => {
    const listener = vi.fn();
    element.addEventListener("reorder-pointermove", listener);

    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    handle?.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 42,
        clientY: 84,
        bubbles: true,
        composed: true,
      }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(
      (listener.mock.calls[0][0] as CustomEvent<{ clientX: number; clientY: number }>).detail,
    ).toEqual({
      clientX: 42,
      clientY: 84,
    });
  });

  it("fires reorder-pointerend on pointerup", () => {
    const listener = vi.fn();
    element.addEventListener("reorder-pointerend", listener);

    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    handle?.dispatchEvent(
      new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("fires reorder-pointerend on pointercancel", () => {
    const listener = vi.fn();
    element.addEventListener("reorder-pointerend", listener);

    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    handle?.dispatchEvent(
      new PointerEvent("pointercancel", { pointerId: 1, bubbles: true, composed: true }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("fires move-up-click when ArrowUp is pressed on the drag handle", () => {
    const listener = vi.fn();
    element.addEventListener("move-up-click", listener);

    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    handle?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("fires move-down-click when ArrowDown is pressed on the drag handle", () => {
    const listener = vi.fn();
    element.addEventListener("move-down-click", listener);

    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    handle?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("fires neither move event for an unrelated key", () => {
    const upListener = vi.fn();
    const downListener = vi.fn();
    element.addEventListener("move-up-click", upListener);
    element.addEventListener("move-down-click", downListener);

    const handle = element.shadowRoot?.querySelector("brew-icon-button.drag-handle");
    handle?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true }),
    );

    expect(upListener).not.toHaveBeenCalled();
    expect(downListener).not.toHaveBeenCalled();
  });
});
