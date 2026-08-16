import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-timer-controls";
import type { TimerControls } from "../TimerControls";

describe("brew-timer-controls", () => {
  let element: TimerControls;

  beforeEach(async () => {
    element = document.createElement("brew-timer-controls") as TimerControls;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const clickInner = (el: Element | null | undefined): void => {
    (el as (HTMLElement & { shadowRoot: ShadowRoot }) | null | undefined)?.shadowRoot
      ?.querySelector("button")
      ?.click();
  };

  describe("idle", () => {
    it("renders idle-actions with a 'Start timer now' button and the empty-state hint", async () => {
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".idle-actions")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".hint")).not.toBeNull();
    });

    it("fires start-click when 'Start timer now' is activated", async () => {
      await element.updateComplete;

      const startClick = new Promise<void>((resolve) => {
        element.addEventListener("start-click", () => resolve());
      });
      clickInner(element.shadowRoot?.querySelector(".idle-actions brew-button"));

      await startClick;
    });

    it("hides 'Choose from saved brews' when hasSavedBrews is false", async () => {
      element.hasSavedBrews = false;
      await element.updateComplete;

      const buttons = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      );
      expect(buttons).toHaveLength(1);
    });

    it("shows an empty-state hint with a link to the calculator when hasSavedBrews is false", async () => {
      element.hasSavedBrews = false;
      await element.updateComplete;

      const hint = element.shadowRoot?.querySelector(".idle-actions .hint");
      expect(hint).not.toBeNull();
      expect(hint?.textContent).toContain("No saved brews yet");

      const link = hint?.querySelector('a[href="/calculate"]');
      expect(link).not.toBeNull();
      expect(link?.textContent?.trim()).toBe("save a ratio");
    });

    it("shows 'Choose from saved brews' and fires choose-saved-click when hasSavedBrews is true", async () => {
      element.hasSavedBrews = true;
      await element.updateComplete;

      const buttons = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      );
      expect(buttons).toHaveLength(2);
      expect(element.shadowRoot?.querySelector(".idle-actions .hint")).toBeNull();

      const chooseButton = buttons.find(
        (button) => button.textContent?.trim() === "Choose from saved brews",
      );

      const chooseClick = new Promise<void>((resolve) => {
        element.addEventListener("choose-saved-click", () => resolve());
      });
      clickInner(chooseButton);

      await chooseClick;
    });
  });
});
