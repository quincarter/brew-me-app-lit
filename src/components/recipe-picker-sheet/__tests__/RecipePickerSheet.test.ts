import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import type { IAeropressRecipe } from "../../../shared/interfaces/brew.interface";
import "../brew-recipe-picker-sheet";
import type { RecipePickerSheet } from "../RecipePickerSheet";

describe("brew-recipe-picker-sheet", () => {
  let element: RecipePickerSheet;

  beforeEach(async () => {
    element = document.createElement("brew-recipe-picker-sheet") as RecipePickerSheet;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders nothing when closed", () => {
    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")).toBeNull();
  });

  it("renders every AEROPRESS_RECIPES entry as a row once opened", async () => {
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(AEROPRESS_RECIPES.length);
  });

  it("renders a row's headline/supporting text from its recipe data", async () => {
    element.open = true;
    await element.updateComplete;

    const recipe = AEROPRESS_RECIPES[0];
    const row = element.shadowRoot?.querySelectorAll("brew-list-row")[0];
    expect(row?.getAttribute("headline")).toBe(`${recipe.competitor} · ${recipe.year}`);
    expect(row?.getAttribute("supporting")).toContain(`${recipe.doseGrams}g coffee`);
    expect(row?.getAttribute("supporting")).toContain(`${recipe.totalWaterGrams}g water`);
  });

  it("passes the open attribute through to the underlying brew-bottom-sheet", async () => {
    element.open = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")?.hasAttribute("open")).toBe(true);
  });

  it("fires recipe-select with the tapped recipe and suppresses the row's own navigation", async () => {
    element.open = true;
    await element.updateComplete;

    const targetIndex = 1;
    const targetRecipe = AEROPRESS_RECIPES[targetIndex];
    const row = element.shadowRoot?.querySelectorAll("brew-list-row")[targetIndex];
    const anchor = row?.shadowRoot?.querySelector("a.row");
    if (!anchor) throw new Error("expected the row's inner anchor");

    const selectEvent = new Promise<CustomEvent<IAeropressRecipe>>((resolve) => {
      element.addEventListener("recipe-select", (event) =>
        resolve(event as CustomEvent<IAeropressRecipe>),
      );
    });

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true, composed: true });
    anchor.dispatchEvent(clickEvent);

    const event = await selectEvent;
    expect(event.detail).toEqual(targetRecipe);
    expect(clickEvent.defaultPrevented).toBe(true);
  });
});
