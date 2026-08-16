import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-top-bar";
import type { TopBar } from "../TopBar";

describe("brew-top-bar", () => {
  let element: TopBar;

  beforeEach(async () => {
    element = document.createElement("brew-top-bar") as TopBar;
    element.title = "Timer";
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the title", () => {
    expect(element.shadowRoot?.querySelector(".title")?.textContent).toBe("Timer");
  });

  it("has an empty trailing slot by default", () => {
    const slot = element.shadowRoot?.querySelector('slot[name="trailing"]') as HTMLSlotElement;
    expect(slot).not.toBeNull();
    expect(slot.assignedNodes()).toHaveLength(0);
  });

  it("projects light-DOM children marked slot=trailing into the trailing slot", async () => {
    const badge = document.createElement("span");
    badge.setAttribute("slot", "trailing");
    badge.textContent = "●";
    element.appendChild(badge);
    await element.updateComplete;

    const slot = element.shadowRoot?.querySelector('slot[name="trailing"]') as HTMLSlotElement;
    expect(slot.assignedNodes()).toContain(badge);
  });
});
