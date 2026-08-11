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
    it("renders idle-actions with a 'Start timer now' button, no controls, and the empty-state hint", async () => {
      element.idle = true;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".idle-actions")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".controls")).toBeNull();
      expect(element.shadowRoot?.querySelector(".hint")).not.toBeNull();
    });

    it("fires start-click when 'Start timer now' is activated", async () => {
      element.idle = true;
      await element.updateComplete;

      const startClick = new Promise<void>((resolve) => {
        element.addEventListener("start-click", () => resolve());
      });
      clickInner(element.shadowRoot?.querySelector(".idle-actions brew-button"));

      await startClick;
    });

    it("hides 'Choose from saved brews' when hasSavedBrews is false", async () => {
      element.idle = true;
      element.hasSavedBrews = false;
      await element.updateComplete;

      const buttons = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      );
      expect(buttons).toHaveLength(1);
    });

    it("shows an empty-state hint with a link to the calculator when hasSavedBrews is false", async () => {
      element.idle = true;
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
      element.idle = true;
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

  describe("active", () => {
    it("renders controls and a hint, not idle-actions", async () => {
      element.idle = false;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".idle-actions")).toBeNull();
      expect(element.shadowRoot?.querySelector(".controls")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".hint")).not.toBeNull();
    });

    it("shows a 'Pause' aria-label and 'Brewing in progress' hint while running", async () => {
      element.idle = false;
      element.running = true;
      await element.updateComplete;

      const playPause = element.shadowRoot?.querySelectorAll("brew-icon-button")[1];
      expect(playPause?.getAttribute("aria-label")).toBe("Pause");
      expect(element.shadowRoot?.querySelector(".hint")?.textContent?.trim()).toBe(
        "Brewing in progress…",
      );
    });

    it("shows a 'Start' aria-label and 'Tap play' hint while paused", async () => {
      element.idle = false;
      element.running = false;
      await element.updateComplete;

      const playPause = element.shadowRoot?.querySelectorAll("brew-icon-button")[1];
      expect(playPause?.getAttribute("aria-label")).toBe("Start");
      expect(element.shadowRoot?.querySelector(".hint")?.textContent?.trim()).toBe(
        "Tap play to start your pour-over timer.",
      );
    });

    it("fires reset-click and toggle-click from their respective icon buttons", async () => {
      element.idle = false;
      await element.updateComplete;

      const resetClick = new Promise<void>((resolve) => {
        element.addEventListener("reset-click", () => resolve());
      });
      element.shadowRoot
        ?.querySelector('brew-icon-button[aria-label="Reset"]')
        ?.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));
      await resetClick;

      const toggleClick = new Promise<void>((resolve) => {
        element.addEventListener("toggle-click", () => resolve());
      });
      element.shadowRoot
        ?.querySelector('brew-icon-button[aria-label="Start"]')
        ?.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));
      await toggleClick;
    });

    it("shows a spacer (no 'Clear brew' control) when hasRecipe is false", async () => {
      element.idle = false;
      element.hasRecipe = false;
      await element.updateComplete;

      expect(
        element.shadowRoot?.querySelector('brew-icon-button[aria-label="Clear brew"]'),
      ).toBeNull();
      expect(element.shadowRoot?.querySelector(".controls .spacer")).not.toBeNull();
    });

    it("shows 'Clear brew' (no spacer) and fires clear-click when hasRecipe is true", async () => {
      element.idle = false;
      element.hasRecipe = true;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".controls .spacer")).toBeNull();

      const clearClick = new Promise<void>((resolve) => {
        element.addEventListener("clear-click", () => resolve());
      });
      element.shadowRoot
        ?.querySelector('brew-icon-button[aria-label="Clear brew"]')
        ?.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));
      await clearClick;
    });
  });
});
