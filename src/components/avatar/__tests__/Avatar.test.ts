import { svg } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-avatar";
import type { Avatar } from "../Avatar";

describe("brew-avatar", () => {
  let element: Avatar;

  beforeEach(async () => {
    element = document.createElement("brew-avatar") as Avatar;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the initial when no icon is set", async () => {
    element.initial = "V";
    await element.updateComplete;

    const avatar = element.shadowRoot?.querySelector(".avatar");
    expect(avatar?.textContent?.trim()).toBe("V");
    expect(avatar?.querySelector("svg")).toBeNull();
  });

  it("still renders the initial when icon is explicitly null", async () => {
    element.initial = "C";
    element.icon = null;
    await element.updateComplete;

    const avatar = element.shadowRoot?.querySelector(".avatar");
    expect(avatar?.textContent?.trim()).toBe("C");
  });

  it("renders the icon instead of the initial when icon is set", async () => {
    element.initial = "V";
    element.icon = svg`<svg data-testid="mock-icon"><circle /></svg>`;
    await element.updateComplete;

    const avatar = element.shadowRoot?.querySelector(".avatar");
    expect(
      avatar?.querySelector("svg[data-testid='mock-icon']"),
    ).not.toBeNull();
    expect(avatar?.textContent?.trim()).not.toBe("V");
  });
});
