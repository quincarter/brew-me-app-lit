import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-chip";
import type { Chip } from "../Chip";

describe("brew-chip", () => {
  let element: Chip;

  beforeEach(async () => {
    element = document.createElement("brew-chip") as Chip;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const button = (): HTMLButtonElement | null | undefined =>
    element.shadowRoot?.querySelector("button.chip");

  it("renders the label", async () => {
    element.label = "V60";
    await element.updateComplete;

    expect(button()?.textContent?.trim()).toBe("V60");
  });

  it("renders unselected, with no check icon, by default", () => {
    expect(button()?.classList.contains("selected")).toBe(false);
    expect(element.shadowRoot?.querySelector("brew-icon")).toBeNull();
  });

  it("renders selected with a leading check icon when selected is set", async () => {
    element.selected = true;
    await element.updateComplete;

    expect(button()?.classList.contains("selected")).toBe(true);
    expect(element.shadowRoot?.querySelector("brew-icon")).not.toBeNull();
  });

  it("fires chip-click when activated", () => {
    let fired = false;
    element.addEventListener("chip-click", () => {
      fired = true;
    });

    button()?.click();

    expect(fired).toBe(true);
  });

  it("is not disabled by default", () => {
    expect(button()?.disabled).toBe(false);
    expect(element.disabled).toBe(false);
  });

  describe("disabled", () => {
    beforeEach(async () => {
      element.disabled = true;
      await element.updateComplete;
    });

    it("renders the underlying button as disabled", () => {
      expect(button()?.disabled).toBe(true);
      expect(element.hasAttribute("disabled")).toBe(true);
    });

    it("does not fire chip-click when activated", () => {
      let fired = false;
      element.addEventListener("chip-click", () => {
        fired = true;
      });

      button()?.click();

      expect(fired).toBe(false);
    });
  });
});
