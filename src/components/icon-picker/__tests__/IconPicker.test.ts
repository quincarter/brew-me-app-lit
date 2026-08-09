import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BREW_ICON_OPTIONS } from "../../../shared/utilities/brew-icon.utility";
import "../brew-icon-picker";
import type { IconPicker } from "../IconPicker";

describe("brew-icon-picker", () => {
  let element: IconPicker;

  beforeEach(async () => {
    element = document.createElement("brew-icon-picker") as IconPicker;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders one button per option", async () => {
    element.options = BREW_ICON_OPTIONS;
    await element.updateComplete;

    const buttons = element.shadowRoot?.querySelectorAll("button.icon-option");
    expect(buttons).toHaveLength(BREW_ICON_OPTIONS.length);
  });

  it("dispatches icon-select with the clicked option's key", async () => {
    element.options = BREW_ICON_OPTIONS;
    await element.updateComplete;

    const target = BREW_ICON_OPTIONS[2];
    if (!target) throw new Error("expected at least three icon options");

    const selectEvent = new Promise<CustomEvent<string>>((resolve) => {
      element.addEventListener("icon-select", (event) => resolve(event as CustomEvent<string>));
    });

    const buttons = element.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.icon-option");
    buttons?.[2]?.click();

    const event = await selectEvent;
    expect(event.detail).toBe(target.key);
  });

  it("marks the option matching selected with the selected class and aria-pressed=true", async () => {
    const first = BREW_ICON_OPTIONS[0];
    if (!first) throw new Error("expected at least one icon option");

    element.options = BREW_ICON_OPTIONS;
    element.selected = first.key;
    await element.updateComplete;

    const buttons = element.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.icon-option");
    const selectedButton = buttons?.[0];
    const otherButton = buttons?.[1];

    expect(selectedButton?.classList.contains("selected")).toBe(true);
    expect(selectedButton?.getAttribute("aria-pressed")).toBe("true");
    expect(otherButton?.classList.contains("selected")).toBe(false);
    expect(otherButton?.getAttribute("aria-pressed")).toBe("false");
  });
});
