import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ISavedBrew } from "../../../shared/interfaces/brew.interface";
import { BREW_STEPS_PRESETS } from "../../../shared/data/brew-steps-presets.data";
import {
  editBeforeBrewingIdSignal,
  postSaveSheetAlreadyOnDetailSignal,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../../../shared/stores/post-save-sheet.store";
import { primedRecipeSignal, resetTimer } from "../../../shared/stores/timer.store";
import "../brew-post-save-sheet";
import type { PostSaveSheet } from "../PostSaveSheet";

const brew: ISavedBrew = {
  id: 12345,
  brewType: "V60",
  ratio: 16,
  water: 320,
  coffee: 20,
  oz: 11,
  createdAt: Date.now(),
};

describe("brew-post-save-sheet", () => {
  let element: PostSaveSheet;

  beforeEach(async () => {
    postSaveSheetOpenSignal.value = false;
    postSaveSheetBrewSignal.value = null;
    postSaveSheetAlreadyOnDetailSignal.value = false;
    editBeforeBrewingIdSignal.value = null;
    resetTimer();
    primedRecipeSignal.value = null;
    window.history.pushState({}, "", "/calculate");

    element = document.createElement("brew-post-save-sheet") as PostSaveSheet;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    window.history.pushState({}, "", "/");
  });

  it("renders nothing when no brew is set", () => {
    expect(postSaveSheetBrewSignal.value).toBeNull();
    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")).toBeNull();
  });

  it("renders nothing once closed, even though the brew is still set", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")).not.toBeNull();

    postSaveSheetOpenSignal.value = false;
    await element.updateComplete;

    expect(postSaveSheetBrewSignal.value).not.toBeNull();
    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")).toBeNull();
  });

  it("renders the brew's display name and a ratio summary with its stats when the sheet is opened", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".identity-name")?.textContent?.trim()).toBe("V60");

    const ratioSummary = element.shadowRoot?.querySelector("brew-ratio-summary");
    expect(ratioSummary).not.toBeNull();
    expect((ratioSummary as unknown as { ratio: number })?.ratio).toBe(16);
    expect((ratioSummary as unknown as { coffee: number })?.coffee).toBe(20);
    expect((ratioSummary as unknown as { water: number })?.water).toBe(320);
    expect((ratioSummary as unknown as { oz: number })?.oz).toBe(11);
  });

  it("renders the custom name over the brewType when one is set", async () => {
    postSaveSheetBrewSignal.value = { ...brew, name: "Sunday morning pour" };
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".identity-name")?.textContent?.trim()).toBe(
      "Sunday morning pour",
    );
  });

  it("closes the sheet when the close button is clicked", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;

    const closeButton = element.shadowRoot?.querySelector('brew-icon-button[aria-label="Close"]');
    expect(closeButton).not.toBeNull();
    const innerButton = closeButton?.shadowRoot?.querySelector("button");
    innerButton?.click();
    await element.updateComplete;

    expect(postSaveSheetOpenSignal.value).toBe(false);
  });

  it("closes the sheet when the bottom sheet's scrim is clicked", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;

    const bottomSheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    bottomSheet?.dispatchEvent(
      new CustomEvent("sheet-scrim-click", { bubbles: true, composed: true }),
    );
    await element.updateComplete;

    expect(postSaveSheetOpenSignal.value).toBe(false);
  });

  it("navigates to the brew's detail screen and closes the sheet when 'Go to brew detail' is clicked", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;

    const detailButton = Array.from(
      element.shadowRoot?.querySelectorAll(".actions brew-button") ?? [],
    ).find((button) => button.textContent?.replace(/\s+/g, " ").includes("Go to brew detail"));
    expect(detailButton).not.toBeUndefined();

    const innerButton = detailButton?.shadowRoot?.querySelector("button");
    innerButton?.click();
    await element.updateComplete;

    expect(window.location.pathname).toBe(`/saved/${brew.id}`);
    expect(postSaveSheetOpenSignal.value).toBe(false);
  });

  it("primes the timer from the brew and navigates to /timer when 'Start guided timer' is clicked", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;

    const timerButton = Array.from(
      element.shadowRoot?.querySelectorAll(".actions brew-button") ?? [],
    ).find((button) => button.textContent?.replace(/\s+/g, " ").includes("Start guided timer"));
    expect(timerButton).not.toBeUndefined();

    const innerButton = timerButton?.shadowRoot?.querySelector("button");
    innerButton?.click();
    await element.updateComplete;

    expect(primedRecipeSignal.value).toEqual({
      name: "V60",
      brewType: "V60",
      coffee: 20,
      water: 320,
      ratio: 16,
      targetSeconds: 210,
      steps: BREW_STEPS_PRESETS.V60.steps,
    });
    expect(window.location.pathname).toBe("/timer");
    expect(postSaveSheetOpenSignal.value).toBe(false);
  });

  it("shows 'Go to brew detail' by default, and 'Edit before brewing' instead when opened from that brew's own detail screen", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    await element.updateComplete;

    const buttonTexts = () =>
      Array.from(element.shadowRoot?.querySelectorAll(".actions brew-button") ?? []).map((b) =>
        b.textContent?.replace(/\s+/g, " ").trim(),
      );
    expect(buttonTexts()).toContain("Go to brew detail");
    expect(buttonTexts()).not.toContain("Edit before brewing");

    postSaveSheetAlreadyOnDetailSignal.value = true;
    await element.updateComplete;

    expect(buttonTexts()).not.toContain("Go to brew detail");
    expect(buttonTexts()).toContain("Edit before brewing");
  });

  it("requests an edit-before-brewing and closes the sheet without navigating, when 'Edit before brewing' is clicked", async () => {
    postSaveSheetBrewSignal.value = brew;
    postSaveSheetOpenSignal.value = true;
    postSaveSheetAlreadyOnDetailSignal.value = true;
    await element.updateComplete;

    const editButton = Array.from(
      element.shadowRoot?.querySelectorAll(".actions brew-button") ?? [],
    ).find((button) => button.textContent?.replace(/\s+/g, " ").includes("Edit before brewing"));
    expect(editButton).not.toBeUndefined();

    const innerButton = editButton?.shadowRoot?.querySelector("button");
    innerButton?.click();
    await element.updateComplete;

    expect(editBeforeBrewingIdSignal.value).toBe(brew.id);
    expect(postSaveSheetOpenSignal.value).toBe(false);
    expect(window.location.pathname).toBe("/calculate");
  });
});
