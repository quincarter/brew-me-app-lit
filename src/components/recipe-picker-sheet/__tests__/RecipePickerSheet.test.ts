import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import { ORIGAMI_RECIPES } from "../../../shared/data/origami-recipes.data";
import { V60_RECIPES } from "../../../shared/data/v60-recipes.data";
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

  it("keeps the bottom sheet mounted but closed so its exit animation can play", () => {
    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet).not.toBeNull();
    expect(sheet?.hasAttribute("open")).toBe(false);
  });

  it("renders every AEROPRESS_RECIPES entry by default once opened", async () => {
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(AEROPRESS_RECIPES.length);
  });

  it("renders V60_RECIPES entries when brewType is set to V60", async () => {
    element.brewType = "V60";
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(V60_RECIPES.length);
    expect(rows?.[0].getAttribute("headline")).toBe(`${V60_RECIPES[0].author} · ${V60_RECIPES[0].title}`);
  });

  it("renders ORIGAMI_RECIPES entries when brewType is set to Origami", async () => {
    element.brewType = "Origami";
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(ORIGAMI_RECIPES.length);
    expect(rows?.[0].getAttribute("headline")).toBe(`${ORIGAMI_RECIPES[0].author} · ${ORIGAMI_RECIPES[0].title}`);
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
