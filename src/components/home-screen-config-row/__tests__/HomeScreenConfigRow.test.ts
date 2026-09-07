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

  it("fires move-up-click when the move-up button is activated", async () => {
    const listener = vi.fn();
    element.addEventListener("move-up-click", listener);

    const [upButton] = element.shadowRoot?.querySelectorAll(".move-btn") ?? [];
    (upButton as HTMLButtonElement)?.click();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("fires move-down-click when the move-down button is activated", async () => {
    const listener = vi.fn();
    element.addEventListener("move-down-click", listener);

    const [, downButton] = element.shadowRoot?.querySelectorAll(".move-btn") ?? [];
    (downButton as HTMLButtonElement)?.click();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("disables and never fires move-up-click when disable-move-up is set", async () => {
    element.disableMoveUp = true;
    await element.updateComplete;

    const [upButton] = element.shadowRoot?.querySelectorAll(".move-btn") ?? [];
    expect((upButton as HTMLButtonElement).disabled).toBe(true);

    const listener = vi.fn();
    element.addEventListener("move-up-click", listener);
    (upButton as HTMLButtonElement).click();

    expect(listener).not.toHaveBeenCalled();
  });

  it("disables and never fires move-down-click when disable-move-down is set", async () => {
    element.disableMoveDown = true;
    await element.updateComplete;

    const [, downButton] = element.shadowRoot?.querySelectorAll(".move-btn") ?? [];
    expect((downButton as HTMLButtonElement).disabled).toBe(true);

    const listener = vi.fn();
    element.addEventListener("move-down-click", listener);
    (downButton as HTMLButtonElement).click();

    expect(listener).not.toHaveBeenCalled();
  });
});
