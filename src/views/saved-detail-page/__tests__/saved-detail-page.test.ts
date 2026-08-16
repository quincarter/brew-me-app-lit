import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import { BREW_STEPS_PRESETS } from "../../../shared/data/brew-steps-presets.data";
import type {
  IBrewStepsConfig,
  ILoadedRecipeSource,
  ISavedBrew,
} from "../../../shared/interfaces/brew.interface";
import { deleteAllCustomBrewTypes } from "../../../shared/stores/brew-types.store";
import {
  addSavedBrew,
  deleteAllSavedBrews,
  savedBrewsSignal,
} from "../../../shared/stores/brew.store";
import {
  editBeforeBrewingIdSignal,
  postSaveSheetAlreadyOnDetailSignal,
  postSaveSheetOpenSignal,
} from "../../../shared/stores/post-save-sheet.store";
import "../saved-detail-page";
import type { SavedDetailPage } from "../saved-detail-page";

describe("saved-detail-page", () => {
  let element: SavedDetailPage;

  const mount = async (brew: ISavedBrew): Promise<void> => {
    element = document.createElement("saved-detail-page") as SavedDetailPage;
    element.routeParams = { id: String(brew.id) };
    document.body.appendChild(element);
    await element.updateComplete;
  };

  beforeEach(() => {
    deleteAllSavedBrews();
    deleteAllCustomBrewTypes();
    postSaveSheetOpenSignal.value = false;
    postSaveSheetAlreadyOnDetailSignal.value = false;
    editBeforeBrewingIdSignal.value = null;
  });

  afterEach(() => {
    element.remove();
  });

  const editButton = (): Element | undefined =>
    Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.replace(/\s+/g, " ").trim() === "Edit",
    );

  const clickButton = (button: Element | undefined): void => {
    button?.shadowRoot?.querySelector("button")?.click();
  };

  describe("read-only view", () => {
    it("renders no brew-steps-card when the saved brew has no brewSteps of its own (backward compatibility)", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
      });
      await mount(brew);

      expect(element.shadowRoot?.querySelector("brew-steps-card")).toBeNull();
      expect(element.shadowRoot?.querySelector(".recipe-banner")).toBeNull();
    });

    it("renders a read-only brew-steps-card matching the saved brew's own brewSteps", async () => {
      const brewSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
      };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
        brewSteps,
      });
      await mount(brew);

      const card = element.shadowRoot?.querySelector("brew-steps-card") as
        | (Element & { config: IBrewStepsConfig | null; editing: boolean })
        | null;
      expect(card).not.toBeNull();
      expect(card?.config).toEqual(brewSteps);
      expect(card?.editing).toBe(false);
    });

    it("shows the 'Pulled from'/'Modified from' banner for a brew with recipeSource, based on the *current saved* values", async () => {
      const recipe = AEROPRESS_RECIPES.find((item) => item.id === "2025-1");
      if (!recipe) throw new Error("expected the 2025-1 WAC recipe to exist in test data");
      const recipeSource: ILoadedRecipeSource = {
        recipeId: recipe.id,
        label: `${recipe.competitor} · ${recipe.year}, 1st place`,
        ratio: 9.44,
        water: 170,
        coffee: 18,
        steps: [],
      };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 6,
        brewSteps: { steps: [] },
        recipeSource,
      });
      await mount(brew);

      const banner = element.shadowRoot?.querySelector(".recipe-banner .primed-banner-text");
      expect(banner?.textContent?.trim()).toBe(`Pulled from ${recipeSource.label}`);
    });

    it("shows 'Modified from' when the saved ratio no longer matches the recipe snapshot", async () => {
      const recipeSource: ILoadedRecipeSource = {
        recipeId: "2025-1",
        label: "Némo Pop · 2025, 1st place",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        steps: [],
      };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 170,
        coffee: 10.63,
        oz: 6,
        brewSteps: { steps: [] },
        recipeSource,
      });
      await mount(brew);

      const banner = element.shadowRoot?.querySelector(".recipe-banner .primed-banner-text");
      expect(banner?.textContent?.trim()).toBe(
        `Modified from ${recipeSource.label} — tap to see the original`,
      );
    });
  });

  describe("Shots/Brews section title", () => {
    it("reads 'Shots' and forwards brew-type='Espresso Shot' to brew-shot-list for that brew type", async () => {
      const brew = addSavedBrew({
        brewType: "Espresso Shot",
        ratio: 2,
        water: 36,
        coffee: 18,
        oz: 1.2,
      });
      await mount(brew);

      const sectionTitles = Array.from(
        element.shadowRoot?.querySelectorAll(".section-title") ?? [],
      );
      expect(sectionTitles.some((title) => title.textContent?.trim() === "Shots")).toBe(true);
      expect(element.shadowRoot?.querySelector("brew-shot-list")?.getAttribute("brew-type")).toBe(
        "Espresso Shot",
      );
    });

    it("reads 'Brews' and forwards the pour-over brew-type to brew-shot-list for a non-espresso brew type", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
      });
      await mount(brew);

      const sectionTitles = Array.from(
        element.shadowRoot?.querySelectorAll(".section-title") ?? [],
      );
      expect(sectionTitles.some((title) => title.textContent?.trim() === "Brews")).toBe(true);
      expect(element.shadowRoot?.querySelector("brew-shot-list")?.getAttribute("brew-type")).toBe(
        "Aeropress",
      );
    });
  });

  describe("brew steps view toggle (recipeSource present)", () => {
    const brewSteps: IBrewStepsConfig = {
      steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 45 }],
    };
    const recipeSource: ILoadedRecipeSource = {
      recipeId: "2025-1",
      label: "Némo Pop · 2025, 1st place",
      ratio: 9.44,
      water: 170,
      coffee: 18,
      steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
    };

    const stepsCard = ():
      | (Element & { config: IBrewStepsConfig | null; diffAgainst: unknown })
      | null =>
      element.shadowRoot?.querySelector("brew-steps-card") as
        | (Element & { config: IBrewStepsConfig | null; diffAgainst: unknown })
        | null;

    const toggleButton = (label: string): HTMLButtonElement | undefined =>
      Array.from(
        element.shadowRoot?.querySelectorAll<HTMLButtonElement>(".brew-steps-view-toggle-btn") ??
          [],
      ).find((button) => button.textContent?.trim() === label);

    it("renders the toggle and defaults to the 'Modified' view (the brew's own current steps, no diff)", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 6,
        brewSteps,
        recipeSource,
      });
      await mount(brew);

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).not.toBeNull();
      const card = stepsCard();
      expect(card?.config).toEqual(brewSteps);
      expect(card?.diffAgainst).toBeNull();
    });

    it("switches the card to the 'Original' recipe steps, with no diffAgainst, when the Original control is clicked", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 6,
        brewSteps,
        recipeSource,
      });
      await mount(brew);

      toggleButton("Original")?.click();
      await element.updateComplete;

      const card = stepsCard();
      expect(card?.config).toEqual({ steps: recipeSource.steps });
      expect(card?.diffAgainst).toBeNull();
    });

    it("switches the card to a diff view - current steps as config, recipe steps as diffAgainst - when the Diff control is clicked", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 6,
        brewSteps,
        recipeSource,
      });
      await mount(brew);

      toggleButton("Diff")?.click();
      await element.updateComplete;

      const card = stepsCard();
      expect(card?.config).toEqual(brewSteps);
      expect(card?.diffAgainst).toEqual(recipeSource.steps);
    });

    it("renders no toggle when the brew has brewSteps but no recipeSource", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
        brewSteps,
      });
      await mount(brew);

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).toBeNull();
    });

    it("renders no toggle while in edit mode, even with recipeSource present", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 6,
        brewSteps,
        recipeSource,
      });
      await mount(brew);

      clickButton(editButton());
      await element.updateComplete;

      // The "Original recipe" sheet stays mounted (closed) once a
      // recipeSource exists rather than being unmounted, so its own toggle
      // is still in the DOM - only the *inline* toggle (outside the sheet)
      // is what edit mode should suppress.
      const toggles = Array.from(
        element.shadowRoot?.querySelectorAll(".brew-steps-view-toggle") ?? [],
      );
      const inlineToggle = toggles.find((toggle) => !toggle.closest("brew-bottom-sheet"));
      expect(inlineToggle).toBeUndefined();
    });

    it("renders no toggle when recipeSource is present but the brew is unmodified - nothing to diff means the toggle would just be a confusing no-op", async () => {
      const unmodifiedSteps: IBrewStepsConfig = { steps: recipeSource.steps };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: recipeSource.ratio,
        water: recipeSource.water,
        coffee: recipeSource.coffee,
        oz: 6,
        brewSteps: unmodifiedSteps,
        recipeSource,
      });
      await mount(brew);

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).toBeNull();
      const card = stepsCard();
      expect(card?.config).toEqual(unmodifiedSteps);
      expect(card?.diffAgainst).toBeNull();
    });
  });

  describe("original recipe sheet (recipeSource present)", () => {
    const brewSteps: IBrewStepsConfig = {
      steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 45 }],
    };
    const recipeSource: ILoadedRecipeSource = {
      recipeId: "2025-1",
      label: "Némo Pop · 2025, 1st place",
      ratio: 9.44,
      water: 170,
      coffee: 18,
      steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
    };

    const openSheet = async (): Promise<void> => {
      element.shadowRoot?.querySelector<HTMLButtonElement>(".recipe-banner")?.click();
      await element.updateComplete;
    };

    it("shows the Original/Diff toggle for a modified brew", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 6,
        brewSteps,
        recipeSource,
      });
      await mount(brew);
      await openSheet();

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).not.toBeNull();
    });

    it("renders no toggle in the sheet for an unmodified brew - it always shows the plain recipe card", async () => {
      const unmodifiedSteps: IBrewStepsConfig = { steps: recipeSource.steps };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: recipeSource.ratio,
        water: recipeSource.water,
        coffee: recipeSource.coffee,
        oz: 6,
        brewSteps: unmodifiedSteps,
        recipeSource,
      });
      await mount(brew);
      await openSheet();

      expect(element.shadowRoot?.querySelector("brew-bottom-sheet")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).toBeNull();
    });
  });

  describe("edit mode", () => {
    it("seeds the edit brew-steps-card from the brew's own brewSteps when present", async () => {
      const brewSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
      };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
        brewSteps,
      });
      await mount(brew);

      clickButton(editButton());
      await element.updateComplete;

      const card = element.shadowRoot?.querySelector("brew-steps-card") as
        | (Element & { config: IBrewStepsConfig | null; editing: boolean })
        | null;
      expect(card).not.toBeNull();
      expect(card?.editing).toBe(true);
      expect(card?.config).toEqual(brewSteps);
    });

    it("falls back to the type's preset when the brew predates this feature (no brewSteps of its own)", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
      });
      await mount(brew);

      clickButton(editButton());
      await element.updateComplete;

      const card = element.shadowRoot?.querySelector("brew-steps-card") as
        | (Element & { config: IBrewStepsConfig | null })
        | null;
      expect(card?.config).toEqual(BREW_STEPS_PRESETS.Aeropress);
    });

    it("round-trips edited brewSteps through updateSavedBrew when Save changes is clicked", async () => {
      const brewSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
      };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
        brewSteps,
      });
      await mount(brew);

      clickButton(editButton());
      await element.updateComplete;

      const editedSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 45 }],
      };
      const card = element.shadowRoot?.querySelector("brew-steps-card");
      card?.dispatchEvent(
        new CustomEvent<IBrewStepsConfig>("config-change", {
          detail: editedSteps,
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      const saveButton = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
        (button) => button.textContent?.trim() === "Save changes",
      );
      clickButton(saveButton);

      const saved = savedBrewsSignal.value.find((item) => item.id === brew.id);
      expect(saved?.brewSteps).toEqual(editedSteps);
    });
  });

  describe("Brew again / edit-before-brewing", () => {
    const brewAgainButton = (): Element | undefined =>
      Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
        (button) => button.textContent?.replace(/\s+/g, " ").trim() === "Brew again",
      );

    it("opens the post-save sheet with alreadyOnDetail set, since we're already on this brew's detail screen", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
      });
      await mount(brew);

      clickButton(brewAgainButton());

      expect(postSaveSheetOpenSignal.value).toBe(true);
      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(true);
    });

    it("enters edit mode, seeded from this brew, when an edit-before-brewing request for this brew's id is pending", async () => {
      const brewSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
      };
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
        brewSteps,
      });
      await mount(brew);
      expect(editButton()).not.toBeUndefined();

      editBeforeBrewingIdSignal.value = brew.id;
      await element.updateComplete;

      expect(editBeforeBrewingIdSignal.value).toBeNull();
      const saveButton = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
        (button) => button.textContent?.trim() === "Save changes",
      );
      expect(saveButton).not.toBeUndefined();
      const card = element.shadowRoot?.querySelector("brew-steps-card") as
        | (Element & { config: IBrewStepsConfig | null; editing: boolean })
        | null;
      expect(card?.editing).toBe(true);
      expect(card?.config).toEqual(brewSteps);
    });

    it("ignores a pending edit-before-brewing request for a different brew's id", async () => {
      const brew = addSavedBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
      });
      await mount(brew);

      editBeforeBrewingIdSignal.value = brew.id + 999;
      await element.updateComplete;

      expect(editBeforeBrewingIdSignal.value).toBe(brew.id + 999);
      expect(editButton()).not.toBeUndefined();
    });
  });
});
