import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_OTHER_RECIPES } from "../../../shared/data/aeropress-other-recipes.data";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import { ESPRESSO_PROFILES } from "../../../shared/data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../../shared/data/espresso-shot-styles.data";
import { ORIGAMI_RECIPES } from "../../../shared/data/origami-recipes.data";
import { V60_RECIPES } from "../../../shared/data/v60-recipes.data";
import type {
  IAeropressExpertRecipe,
  IAeropressRecipe,
  IEspressoProfile,
  IEspressoShotStyle,
} from "../../../shared/interfaces/brew.interface";
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

  it("renders every AEROPRESS_RECIPES and AEROPRESS_OTHER_RECIPES entry by default once opened", async () => {
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(AEROPRESS_RECIPES.length + AEROPRESS_OTHER_RECIPES.length);
  });

  it("titles the default Aeropress sheet 'Load an AeroPress recipe'", async () => {
    element.open = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".title")?.textContent).toBe(
      "Load an AeroPress recipe",
    );
  });

  it("shows a section label above the WAC and Other groups, splitting the two", async () => {
    element.open = true;
    await element.updateComplete;

    const labels = Array.from(element.shadowRoot?.querySelectorAll(".section-label") ?? []).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(["World AeroPress Championship", "Other creators"]);
  });

  it("appends AEROPRESS_OTHER_RECIPES after the WAC recipes, with author/title headline and dose/water supporting text", async () => {
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    const otherRow = rows?.[AEROPRESS_RECIPES.length];
    const recipe = AEROPRESS_OTHER_RECIPES[0];
    expect(otherRow?.getAttribute("headline")).toBe(`${recipe.author} · ${recipe.title}`);
    expect(otherRow?.getAttribute("supporting")).toContain(`${recipe.setup.Dose} coffee`);
    expect(otherRow?.getAttribute("supporting")).toContain(`${recipe.setup.Water} water`);
  });

  it("fires recipe-select with the tapped Other recipe's full object", async () => {
    element.open = true;
    await element.updateComplete;

    const targetRecipe = AEROPRESS_OTHER_RECIPES[0];
    const row = element.shadowRoot?.querySelectorAll("brew-list-row")[AEROPRESS_RECIPES.length];
    const anchor = row?.shadowRoot?.querySelector("a.row");
    if (!anchor) throw new Error("expected the row's inner anchor");

    const selectEvent = new Promise<CustomEvent<IAeropressExpertRecipe>>((resolve) => {
      element.addEventListener("recipe-select", (event) =>
        resolve(event as CustomEvent<IAeropressExpertRecipe>),
      );
    });

    anchor.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }),
    );

    const event = await selectEvent;
    expect(event.detail).toEqual(targetRecipe);
  });

  it("renders V60_RECIPES entries when brewType is set to V60", async () => {
    element.brewType = "V60";
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(V60_RECIPES.length);
    expect(rows?.[0].getAttribute("headline")).toBe(
      `${V60_RECIPES[0].author} · ${V60_RECIPES[0].title}`,
    );
  });

  it("renders ORIGAMI_RECIPES entries when brewType is set to Origami", async () => {
    element.brewType = "Origami";
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(ORIGAMI_RECIPES.length);
    expect(rows?.[0].getAttribute("headline")).toBe(
      `${ORIGAMI_RECIPES[0].author} · ${ORIGAMI_RECIPES[0].title}`,
    );
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

  it("renders the combined ESPRESSO_SHOT_STYLES + ESPRESSO_PROFILES list when brewType is Espresso Shot", async () => {
    element.brewType = "Espresso Shot";
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(ESPRESSO_SHOT_STYLES.length + ESPRESSO_PROFILES.length);
    expect(rows?.[0].getAttribute("headline")).toBe(ESPRESSO_SHOT_STYLES[0].label);
    expect(rows?.[ESPRESSO_SHOT_STYLES.length].getAttribute("headline")).toBe(
      ESPRESSO_PROFILES[0].name,
    );
  });

  it("fires recipe-select with the tapped shot style's full object", async () => {
    element.brewType = "Espresso Shot";
    element.open = true;
    await element.updateComplete;

    const targetStyle = ESPRESSO_SHOT_STYLES[0];
    const row = element.shadowRoot?.querySelectorAll("brew-list-row")[0];
    const anchor = row?.shadowRoot?.querySelector("a.row");
    if (!anchor) throw new Error("expected the row's inner anchor");

    const selectEvent = new Promise<CustomEvent<IEspressoShotStyle>>((resolve) => {
      element.addEventListener("recipe-select", (event) =>
        resolve(event as CustomEvent<IEspressoShotStyle>),
      );
    });

    anchor.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }),
    );

    const event = await selectEvent;
    expect(event.detail).toEqual(targetStyle);
  });

  it("fires recipe-select with the tapped profile's full object", async () => {
    element.brewType = "Espresso Shot";
    element.open = true;
    await element.updateComplete;

    const targetProfile = ESPRESSO_PROFILES[0];
    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    const row = rows?.[ESPRESSO_SHOT_STYLES.length];
    const anchor = row?.shadowRoot?.querySelector("a.row");
    if (!anchor) throw new Error("expected the row's inner anchor");

    const selectEvent = new Promise<CustomEvent<IEspressoProfile>>((resolve) => {
      element.addEventListener("recipe-select", (event) =>
        resolve(event as CustomEvent<IEspressoProfile>),
      );
    });

    anchor.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }),
    );

    const event = await selectEvent;
    expect(event.detail).toEqual(targetProfile);
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
