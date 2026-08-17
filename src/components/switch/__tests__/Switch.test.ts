import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-switch";
import type { Switch } from "../Switch";

describe("brew-switch", () => {
  let element: Switch;

  beforeEach(async () => {
    element = document.createElement("brew-switch") as Switch;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const track = (): HTMLButtonElement | null | undefined =>
    element.shadowRoot?.querySelector("button.track");

  it("renders unchecked by default", () => {
    expect(track()?.classList.contains("checked")).toBe(false);
    expect(track()?.getAttribute("aria-checked")).toBe("false");
  });

  it("renders checked when checked is set", async () => {
    element.checked = true;
    await element.updateComplete;

    expect(track()?.classList.contains("checked")).toBe(true);
    expect(track()?.getAttribute("aria-checked")).toBe("true");
  });

  it("fires change with the toggled state when activated", async () => {
    const eventPromise = new Promise<boolean>((resolve) => {
      element.addEventListener("change", (event) =>
        resolve((event as CustomEvent<boolean>).detail),
      );
    });

    track()?.click();

    expect(await eventPromise).toBe(true);
  });

  it("is not disabled by default", () => {
    expect(track()?.disabled).toBe(false);
    expect(element.disabled).toBe(false);
  });

  describe("disabled", () => {
    beforeEach(async () => {
      element.disabled = true;
      await element.updateComplete;
    });

    it("renders the underlying button as disabled", () => {
      expect(track()?.disabled).toBe(true);
      expect(element.hasAttribute("disabled")).toBe(true);
    });

    it("does not fire change when activated", () => {
      let fired = false;
      element.addEventListener("change", () => {
        fired = true;
      });

      track()?.click();

      expect(fired).toBe(false);
    });
  });
});
