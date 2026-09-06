import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-lever-espresso-loader";
import type { LeverEspressoLoader } from "../LeverEspressoLoader";

describe("brew-lever-espresso-loader", () => {
  let element: LeverEspressoLoader;

  beforeEach(async () => {
    element = document.createElement("brew-lever-espresso-loader") as LeverEspressoLoader;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("hides the whole decorative graphic from assistive tech", () => {
    const root = element.shadowRoot?.querySelector(".lever-espresso-loader");
    expect(root?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the machine body, lever, group head, portafilter, spout, shot, cup, espresso, and crema pieces", () => {
    const root = element.shadowRoot;
    expect(root?.querySelector(".machine-body")).not.toBeNull();
    expect(root?.querySelector(".lever")).not.toBeNull();
    expect(root?.querySelector(".group-head")).not.toBeNull();
    expect(root?.querySelector(".portafilter")).not.toBeNull();
    expect(root?.querySelector(".spout")).not.toBeNull();
    expect(root?.querySelector(".shot")).not.toBeNull();
    expect(root?.querySelector(".cup")).not.toBeNull();
    expect(root?.querySelector(".espresso-liquid")).not.toBeNull();
    expect(root?.querySelector(".crema")).not.toBeNull();
  });

  it("nests the crema inside the espresso liquid, so it rides along on top as the level animates", () => {
    const liquid = element.shadowRoot?.querySelector(".espresso-liquid");
    expect(liquid?.querySelector(".crema")).not.toBeNull();
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
