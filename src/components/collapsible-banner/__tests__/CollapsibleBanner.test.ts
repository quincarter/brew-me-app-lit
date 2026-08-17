import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-collapsible-banner";
import type { CollapsibleBanner } from "../CollapsibleBanner";

describe("brew-collapsible-banner", () => {
  let element: CollapsibleBanner;

  beforeEach(async () => {
    element = document.createElement("brew-collapsible-banner") as CollapsibleBanner;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("defaults to closed", () => {
    expect(element.open).toBe(false);
    expect(element.hasAttribute("open")).toBe(false);
  });

  it("stays mounted (and keeps its slotted content) while closed", async () => {
    const child = document.createElement("span");
    child.textContent = "hello";
    element.appendChild(child);
    await element.updateComplete;

    expect(element.isConnected).toBe(true);
    expect(element.contains(child)).toBe(true);
  });

  it("marks its inner row inert while closed so collapsed content can't be focused or clicked", async () => {
    const row = element.shadowRoot?.querySelector(".row");
    expect(row?.hasAttribute("inert")).toBe(true);
  });

  it("reflects open to the host attribute and clears inert once opened", async () => {
    element.open = true;
    await element.updateComplete;

    expect(element.hasAttribute("open")).toBe(true);
    const row = element.shadowRoot?.querySelector(".row");
    expect(row?.hasAttribute("inert")).toBe(false);
  });

  it("re-applies inert once closed again", async () => {
    element.open = true;
    await element.updateComplete;
    element.open = false;
    await element.updateComplete;

    const row = element.shadowRoot?.querySelector(".row");
    expect(row?.hasAttribute("inert")).toBe(true);
  });
});
