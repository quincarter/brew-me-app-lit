import { describe, expect, it } from "vitest";
import { ORIGAMI_RECIPES } from "../../data/origami-recipes.data";
import { V60_RECIPES } from "../../data/v60-recipes.data";
import {
  getPouroverRecipeLabel,
  getPouroverRecipeRatio,
  getPouroverRecipeSteps,
  parseDoseGrams,
  parseWaterGrams,
} from "../pourover-recipe.utility";

describe("pourover-recipe.utility", () => {
  it("parses dose grams accurately for V60 recipes", () => {
    expect(parseDoseGrams(V60_RECIPES[0])).toBe(22); // Scott Rao
    expect(parseDoseGrams(V60_RECIPES[1])).toBe(30); // James Hoffmann
  });

  it("parses water grams accurately including multi-part water specs", () => {
    expect(parseWaterGrams(V60_RECIPES[0])).toBe(360);
    // Kurasu iced coffee: "140g (hot) + 80g ice" => 220g total
    const kurasu = ORIGAMI_RECIPES.find((r) => r.id === "kurasu-origami-iced-coffee")!;
    expect(parseWaterGrams(kurasu)).toBe(220);
  });

  it("computes ratio correctly", () => {
    const rao = V60_RECIPES[0];
    expect(getPouroverRecipeRatio(rao)).toBe(16.36);
  });

  it("combines setup notes and hand-curated timedSteps for timer ingestion", () => {
    const rao = V60_RECIPES[0];
    const steps = getPouroverRecipeSteps(rao);
    const setupCount = Object.keys(rao.setup).length;
    expect(steps.length).toBe(setupCount + (rao.timedSteps?.length ?? 0));
    expect(steps.slice(setupCount)).toEqual(rao.timedSteps);
    expect(steps.some((s) => s.kind === "timed" && s.seconds === 45)).toBe(true);
    expect(getPouroverRecipeLabel(rao)).toBe("Scott Rao — Spin to Win");
  });

  it("falls back to generating setup notes and prose steps when timedSteps is absent", () => {
    const untimedRecipe = { ...V60_RECIPES[0], timedSteps: undefined };
    const steps = getPouroverRecipeSteps(untimedRecipe);
    expect(steps.length).toBe(Object.keys(untimedRecipe.setup).length + untimedRecipe.steps.length);
  });
});
