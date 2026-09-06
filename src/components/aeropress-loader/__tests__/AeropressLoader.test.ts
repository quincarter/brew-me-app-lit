import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-aeropress-loader";
import type { AeropressLoader } from "../AeropressLoader";

describe("brew-aeropress-loader", () => {
  let element: AeropressLoader;

  beforeEach(async () => {
    element = document.createElement("brew-aeropress-loader") as AeropressLoader;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("hides the whole decorative graphic from assistive tech", () => {
    const root = element.shadowRoot?.querySelector(".aeropress-loader");
    expect(root?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the plunger, chamber (with the coffee sitting inside it), filter cap, flow, and cup pieces", () => {
    const root = element.shadowRoot;
    expect(root?.querySelector(".plunger-rod")).not.toBeNull();
    expect(root?.querySelector(".plunger-cap")).not.toBeNull();
    expect(root?.querySelector(".chamber")).not.toBeNull();
    expect(root?.querySelector(".chamber-liquid")).not.toBeNull();
    expect(root?.querySelector(".filter-cap")).not.toBeNull();
    expect(root?.querySelector(".flow")).not.toBeNull();
    expect(root?.querySelector(".cup")).not.toBeNull();
    expect(root?.querySelector(".cup-liquid")).not.toBeNull();
  });

  it("nests the chamber's coffee inside the chamber, not as a loose sibling", () => {
    const chamber = element.shadowRoot?.querySelector(".chamber");
    expect(chamber?.querySelector(".chamber-liquid")).not.toBeNull();
  });

  it("renders the plunger before the chamber, so the translucent chamber layers over it", () => {
    const children = [...(element.shadowRoot?.querySelector(".aeropress-loader")?.children ?? [])];
    const plungerIndex = children.findIndex((child) => child.classList.contains("plunger"));
    const chamberIndex = children.findIndex((child) => child.classList.contains("chamber"));

    expect(plungerIndex).toBeGreaterThanOrEqual(0);
    expect(chamberIndex).toBeGreaterThan(plungerIndex);
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
