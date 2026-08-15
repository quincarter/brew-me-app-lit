import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  IBrewStepsConfig,
  ILoadedRecipeSource,
  IShareableBrew,
} from "../../../shared/interfaces/brew.interface";
import { deleteAllCustomBrewTypes } from "../../../shared/stores/brew-types.store";
import { deleteAllSavedBrews } from "../../../shared/stores/brew.store";
import { buildShareUrl } from "../../../shared/utilities/share.utility";
import "../brew-share-page";
import type { BrewSharePage } from "../brew-share-page";

const BREW_STEPS: IBrewStepsConfig = {
  steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
};

const RECIPE_SOURCE: ILoadedRecipeSource = {
  recipeId: "2025-1",
  label: "Némo Pop · 2025, 1st place",
  ratio: 9.44,
  water: 170,
  coffee: 18,
  steps: [{ id: "y", label: "Pour", kind: "note", value: "Standard" }],
};

describe("brew-share-page", () => {
  let element: BrewSharePage;

  /** Mirrors how the app actually gets here - a `/share?...` URL - since this view parses `window.location.search` in `connectedCallback` rather than `routeParams`. */
  const mount = async (brew: IShareableBrew): Promise<void> => {
    const url = buildShareUrl(brew, "https://brewme.app");
    const search = url.slice(url.indexOf("?"));
    window.history.pushState({}, "", `/share${search}`);

    element = document.createElement("brew-share-page") as BrewSharePage;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  const mountWithSearch = async (search: string): Promise<void> => {
    window.history.pushState({}, "", `/share${search}`);
    element = document.createElement("brew-share-page") as BrewSharePage;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  beforeEach(() => {
    deleteAllSavedBrews();
    deleteAllCustomBrewTypes();
  });

  afterEach(() => {
    element.remove();
    window.history.pushState({}, "", "/");
  });

  it("renders brew-empty-state and no ratio content when the share link is missing/damaged", async () => {
    await mountWithSearch("?ratio=16&water=480&coffee=30&oz=16.93");

    expect(element.shadowRoot?.querySelector("brew-empty-state")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".ratio-hero")).toBeNull();
    expect(element.shadowRoot?.querySelector("brew-steps-card")).toBeNull();
    expect(element.shadowRoot?.querySelector(".recipe-banner")).toBeNull();
  });

  it("renders no brew-steps-card and no recipe banner for a bare ratio share link", async () => {
    await mount({ brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 });

    expect(element.shadowRoot?.querySelector("brew-empty-state")).toBeNull();
    expect(element.shadowRoot?.querySelector("brew-steps-card")).toBeNull();
    expect(element.shadowRoot?.querySelector(".recipe-banner")).toBeNull();
  });

  it("renders a brew-steps-card matching the URL's steps param", async () => {
    await mount({
      brewType: "Aeropress",
      ratio: 9.44,
      water: 170,
      coffee: 18,
      oz: 5.75,
      brewSteps: BREW_STEPS,
    });

    const card = element.shadowRoot?.querySelector("brew-steps-card") as
      | (Element & { config: IBrewStepsConfig | null })
      | null;
    expect(card).not.toBeNull();
    expect(card?.config).toEqual(BREW_STEPS);
  });

  it("shows the 'Pulled from {label}' banner when the URL's recipe param matches the shared numbers", async () => {
    await mount({
      brewType: "Aeropress",
      ratio: 9.44,
      water: 170,
      coffee: 18,
      oz: 5.75,
      brewSteps: { steps: RECIPE_SOURCE.steps },
      recipeSource: RECIPE_SOURCE,
    });

    const banner = element.shadowRoot?.querySelector(".recipe-banner .primed-banner-text");
    expect(banner?.textContent?.trim()).toBe(`Pulled from ${RECIPE_SOURCE.label}`);
  });

  it("shows the 'Modified from {label} — tap to see the original' banner when the shared numbers diverge from the recipe snapshot", async () => {
    await mount({
      brewType: "Aeropress",
      ratio: 16,
      water: 170,
      coffee: 10.63,
      oz: 5.75,
      brewSteps: { steps: [] },
      recipeSource: RECIPE_SOURCE,
    });

    const banner = element.shadowRoot?.querySelector(".recipe-banner .primed-banner-text");
    expect(banner?.textContent?.trim()).toBe(
      `Modified from ${RECIPE_SOURCE.label} — tap to see the original`,
    );
  });

  it("opens the original-recipe bottom sheet when the banner is clicked", async () => {
    await mount({
      brewType: "Aeropress",
      ratio: 9.44,
      water: 170,
      coffee: 18,
      oz: 5.75,
      brewSteps: { steps: RECIPE_SOURCE.steps },
      recipeSource: RECIPE_SOURCE,
    });

    // The sheet element is mounted (not conditionally rendered) as soon as a
    // recipeSource exists, closed - so a later open-to-close transition can
    // actually animate instead of the element being yanked out of the DOM.
    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")?.hasAttribute("open")).toBe(
      false,
    );

    element.shadowRoot?.querySelector<HTMLButtonElement>(".recipe-banner")?.click();
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet).not.toBeNull();
    expect(sheet?.hasAttribute("open")).toBe(true);
    expect(element.shadowRoot?.querySelector(".title")?.textContent?.trim()).toBe(
      "Original recipe",
    );
  });

  describe("brew steps view toggle (recipeSource present)", () => {
    it("renders no inline toggle and no sheet toggle for an unmodified (Pulled from) brew - nothing to diff means the toggle would just be a confusing no-op", async () => {
      await mount({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 5.75,
        brewSteps: { steps: RECIPE_SOURCE.steps },
        recipeSource: RECIPE_SOURCE,
      });

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).toBeNull();

      element.shadowRoot?.querySelector<HTMLButtonElement>(".recipe-banner")?.click();
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("brew-bottom-sheet")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).toBeNull();
    });

    it("renders both the inline toggle and the sheet toggle for a modified brew", async () => {
      await mount({
        brewType: "Aeropress",
        ratio: 16,
        water: 170,
        coffee: 10.63,
        oz: 5.75,
        brewSteps: { steps: [] },
        recipeSource: RECIPE_SOURCE,
      });

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).not.toBeNull();

      element.shadowRoot?.querySelector<HTMLButtonElement>(".recipe-banner")?.click();
      await element.updateComplete;

      const toggles = element.shadowRoot?.querySelectorAll(".brew-steps-view-toggle");
      expect(toggles?.length).toBe(2);
    });
  });
});
