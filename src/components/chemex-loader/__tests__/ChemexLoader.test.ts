import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-chemex-loader";
import type { ChemexLoader } from "../ChemexLoader";

describe("brew-chemex-loader", () => {
  let element: ChemexLoader;

  beforeEach(async () => {
    element = document.createElement("brew-chemex-loader") as ChemexLoader;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("hides the whole decorative graphic from assistive tech", () => {
    const root = element.shadowRoot?.querySelector(".chemex-loader");
    expect(root?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the pour, cone, grounds, collar, neck, flow, bulb, and bulb-liquid pieces", () => {
    const root = element.shadowRoot;
    expect(root?.querySelector(".pour")).not.toBeNull();
    expect(root?.querySelector(".cone")).not.toBeNull();
    expect(root?.querySelector(".grounds")).not.toBeNull();
    expect(root?.querySelector(".collar")).not.toBeNull();
    expect(root?.querySelector(".neck")).not.toBeNull();
    expect(root?.querySelector(".flow")).not.toBeNull();
    expect(root?.querySelector(".bulb")).not.toBeNull();
    expect(root?.querySelector(".bulb-liquid")).not.toBeNull();
  });

  it("nests the bulb's coffee inside the bulb, not as a loose sibling", () => {
    const bulb = element.shadowRoot?.querySelector(".bulb");
    expect(bulb?.querySelector(".bulb-liquid")).not.toBeNull();
  });

  describe("done", () => {
    it("defaults to false, with no done attribute", () => {
      expect(element.done).toBe(false);
      expect(element.hasAttribute("done")).toBe(false);
    });

    it("reflects to a done attribute when set, so :host([done]) can style the finished pose", async () => {
      element.done = true;
      await element.updateComplete;

      expect(element.hasAttribute("done")).toBe(true);
    });

    it("clears the done attribute when unset again", async () => {
      element.done = true;
      await element.updateComplete;
      element.done = false;
      await element.updateComplete;

      expect(element.hasAttribute("done")).toBe(false);
    });
  });
});
