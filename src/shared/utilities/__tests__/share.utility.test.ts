import { afterEach, describe, expect, it, vi } from "vitest";
import type { IBrewStepsConfig } from "../../interfaces/brew.interface";
import { buildRecipeSource } from "../recipe-registry.utility";
import { buildShareUrl, parseShareParams, shareBrew } from "../share.utility";

const BREW_STEPS: IBrewStepsConfig = {
  steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
};

// Real, registered curated recipe - `buildRecipeSource` only resolves ids
// that exist in the bundled recipe data, so fixtures have to come from there
// rather than being hand-rolled.
const AEROPRESS_RECIPE_SOURCE = buildRecipeSource("2025-1");
if (!AEROPRESS_RECIPE_SOURCE) {
  throw new Error("Fixture recipe id '2025-1' is no longer registered - update the test fixture.");
}
const RECIPE_SOURCE = AEROPRESS_RECIPE_SOURCE;

describe("share.utility", () => {
  describe("buildShareUrl", () => {
    it("builds an absolute share URL carrying every brew field", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );
      expect(url).toBe(
        "https://brewme.app/share?brewType=Pour-over&ratio=16&water=480&coffee=30&oz=16.93",
      );
    });

    it("adds a name param when the brew has a custom name", () => {
      const url = buildShareUrl(
        {
          brewType: "Pour-over",
          name: "Sunday morning pour",
          ratio: 16,
          water: 480,
          coffee: 30,
          oz: 16.93,
        },
        "https://brewme.app",
      );
      expect(url).toBe(
        "https://brewme.app/share?brewType=Pour-over&ratio=16&water=480&coffee=30&oz=16.93&name=Sunday+morning+pour",
      );
    });

    it("omits the name param entirely when the brew has no name", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );
      expect(url).not.toContain("name=");
    });

    it("omits the steps/recipe params entirely when the brew has neither field", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );

      const params = new URLSearchParams(url.slice(url.indexOf("?")));
      expect(params.has("steps")).toBe(false);
      expect(params.has("recipe")).toBe(false);
    });

    it("sets recipe to a bare recipeId (not JSON) and omits steps when brewSteps exactly matches the recipe's own steps", () => {
      const url = buildShareUrl(
        {
          brewType: "Aeropress",
          ratio: RECIPE_SOURCE.ratio,
          water: RECIPE_SOURCE.water,
          coffee: RECIPE_SOURCE.coffee,
          oz: 5.75,
          brewSteps: { steps: RECIPE_SOURCE.steps },
          recipeSource: RECIPE_SOURCE,
        },
        "https://brewme.app",
      );

      const params = new URLSearchParams(url.slice(url.indexOf("?")));
      expect(params.get("recipe")).toBe(RECIPE_SOURCE.recipeId);
      expect(() => JSON.parse(params.get("recipe") ?? "")).toThrow();
      expect(params.has("steps")).toBe(false);
    });

    it("sends a compact diff (not full JSON steps) while keeping a bare recipe id when brewSteps diverges from the recipe's own steps", () => {
      const timedIndex = RECIPE_SOURCE.steps.findIndex((step) => step.kind === "timed");
      expect(timedIndex).toBeGreaterThanOrEqual(0);
      const modifiedSteps = RECIPE_SOURCE.steps.map((step, index) =>
        index === timedIndex ? { ...step, seconds: (step.seconds ?? 0) + 5 } : step,
      );

      const url = buildShareUrl(
        {
          brewType: "Aeropress",
          ratio: RECIPE_SOURCE.ratio,
          water: RECIPE_SOURCE.water,
          coffee: RECIPE_SOURCE.coffee,
          oz: 5.75,
          brewSteps: { steps: modifiedSteps },
          recipeSource: RECIPE_SOURCE,
        },
        "https://brewme.app",
      );

      const params = new URLSearchParams(url.slice(url.indexOf("?")));
      expect(params.get("recipe")).toBe(RECIPE_SOURCE.recipeId);
      expect(params.has("steps")).toBe(false);

      const diff = JSON.parse(params.get("diff") ?? "");
      const changedStep = RECIPE_SOURCE.steps[timedIndex];
      expect(diff).toEqual({
        changed: [{ id: changedStep.id, seconds: (changedStep.seconds ?? 0) + 5 }],
      });
    });

    it("still sends full JSON steps when brewSteps is present but there's no recipeSource", () => {
      const url = buildShareUrl(
        {
          brewType: "Aeropress",
          ratio: 9.44,
          water: 170,
          coffee: 18,
          oz: 5.75,
          brewSteps: BREW_STEPS,
        },
        "https://brewme.app",
      );

      const params = new URLSearchParams(url.slice(url.indexOf("?")));
      expect(params.has("recipe")).toBe(false);
      expect(JSON.parse(params.get("steps") ?? "")).toEqual(BREW_STEPS);
    });
  });

  describe("parseShareParams", () => {
    it("parses a valid query string back into a brew", () => {
      expect(parseShareParams("?brewType=Pour-over&ratio=16&water=480&coffee=30&oz=16.93")).toEqual(
        {
          brewType: "Pour-over",
          ratio: 16,
          water: 480,
          coffee: 30,
          oz: 16.93,
        },
      );
    });

    it("round-trips brew types containing spaces", () => {
      const url = buildShareUrl(
        { brewType: "Cold Brew", ratio: 4, water: 400, coffee: 100, oz: 14.11 },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      expect(parseShareParams(search)?.brewType).toBe("Cold Brew");
    });

    it("returns null when the brew type is missing", () => {
      expect(parseShareParams("?ratio=16&water=480&coffee=30&oz=16.93")).toBeNull();
    });

    it("returns null when a numeric field is non-numeric or non-positive", () => {
      expect(
        parseShareParams("?brewType=Pour-over&ratio=0&water=480&coffee=30&oz=16.93"),
      ).toBeNull();
      expect(
        parseShareParams("?brewType=Pour-over&ratio=abc&water=480&coffee=30&oz=16.93"),
      ).toBeNull();
    });

    it("round-trips a custom name through buildShareUrl and parseShareParams", () => {
      const url = buildShareUrl(
        {
          brewType: "Pour-over",
          name: "Sunday morning pour",
          ratio: 16,
          water: 480,
          coffee: 30,
          oz: 16.93,
        },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      expect(parseShareParams(search)).toEqual({
        brewType: "Pour-over",
        name: "Sunday morning pour",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.93,
      });
    });

    it("omits the name key entirely when the URL carries no name param", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      const parsed = parseShareParams(search);
      expect(parsed).not.toBeNull();
      expect("name" in (parsed as object)).toBe(false);
    });

    it("omits brewSteps/recipeSource keys entirely when the URL carries no steps/recipe params", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      const parsed = parseShareParams(search);
      expect(parsed).not.toBeNull();
      expect("brewSteps" in (parsed as object)).toBe(false);
      expect("recipeSource" in (parsed as object)).toBe(false);
    });

    it("round-trips an unmodified curated-recipe share end-to-end, reconstructing recipeSource/brewSteps from the recipe id alone", () => {
      const url = buildShareUrl(
        {
          brewType: "Aeropress",
          ratio: RECIPE_SOURCE.ratio,
          water: RECIPE_SOURCE.water,
          coffee: RECIPE_SOURCE.coffee,
          oz: 5.75,
          brewSteps: { steps: RECIPE_SOURCE.steps },
          recipeSource: RECIPE_SOURCE,
        },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      // Nothing is transmitted for steps when they match the recipe snapshot.
      expect(new URLSearchParams(search).has("steps")).toBe(false);

      const parsed = parseShareParams(search);
      expect(parsed?.recipeSource).toEqual(buildRecipeSource(RECIPE_SOURCE.recipeId));
      expect(parsed?.brewSteps).toEqual({
        steps: buildRecipeSource(RECIPE_SOURCE.recipeId)?.steps,
      });
    });

    it("round-trips a modified curated-recipe share: brewSteps carries the edit while recipeSource still reflects the true original", () => {
      const timedIndex = RECIPE_SOURCE.steps.findIndex((step) => step.kind === "timed");
      const modifiedSteps = RECIPE_SOURCE.steps.map((step, index) =>
        index === timedIndex ? { ...step, seconds: (step.seconds ?? 0) + 5 } : step,
      );

      const url = buildShareUrl(
        {
          brewType: "Aeropress",
          ratio: RECIPE_SOURCE.ratio,
          water: RECIPE_SOURCE.water,
          coffee: RECIPE_SOURCE.coffee,
          oz: 5.75,
          brewSteps: { steps: modifiedSteps },
          recipeSource: RECIPE_SOURCE,
        },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      expect(new URLSearchParams(search).has("diff")).toBe(true);
      expect(new URLSearchParams(search).has("steps")).toBe(false);

      const parsed = parseShareParams(search);

      expect(parsed?.brewSteps).toEqual({ steps: modifiedSteps });
      expect(parsed?.recipeSource).toEqual(RECIPE_SOURCE);
      expect(parsed?.brewSteps).not.toEqual({ steps: parsed?.recipeSource?.steps });
    });

    it("drops recipeSource for an unrecognized recipe id but still parses the rest of the brew", () => {
      const parsed = parseShareParams(
        "?brewType=Aeropress&ratio=9.44&water=170&coffee=18&oz=5.75&recipe=some-made-up-id",
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.ratio).toBe(9.44);
      expect(parsed?.water).toBe(170);
      expect(parsed?.coffee).toBe(18);
      expect(parsed?.oz).toBe(5.75);
      expect("recipeSource" in (parsed as object)).toBe(false);
    });

    it("tolerates a malformed steps param, dropping brewSteps but still parsing the rest of the brew", () => {
      const parsed = parseShareParams(
        "?brewType=Aeropress&ratio=9.44&water=170&coffee=18&oz=5.75&steps=not-json",
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.ratio).toBe(9.44);
      expect(parsed?.water).toBe(170);
      expect(parsed?.coffee).toBe(18);
      expect(parsed?.oz).toBe(5.75);
      expect("brewSteps" in (parsed as object)).toBe(false);
    });

    it("tolerates a syntactically-valid but wrong-shaped steps param, dropping brewSteps without casting blindly", () => {
      const objectShaped = parseShareParams(
        `?brewType=Aeropress&ratio=9.44&water=170&coffee=18&oz=5.75&steps=${encodeURIComponent(
          JSON.stringify({ foo: "bar" }),
        )}`,
      );
      expect(objectShaped).not.toBeNull();
      expect("brewSteps" in (objectShaped as object)).toBe(false);

      const numberShaped = parseShareParams(
        "?brewType=Aeropress&ratio=9.44&water=170&coffee=18&oz=5.75&steps=123",
      );
      expect(numberShaped).not.toBeNull();
      expect("brewSteps" in (numberShaped as object)).toBe(false);
    });

    it("tolerates a malformed diff param when there's no recipe to fall back to, dropping brewSteps but still parsing the rest of the brew", () => {
      const parsed = parseShareParams(
        "?brewType=Aeropress&ratio=9.44&water=170&coffee=18&oz=5.75&diff=not-json",
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.ratio).toBe(9.44);
      expect(parsed?.water).toBe(170);
      expect(parsed?.coffee).toBe(18);
      expect(parsed?.oz).toBe(5.75);
      expect("brewSteps" in (parsed as object)).toBe(false);
      expect("recipeSource" in (parsed as object)).toBe(false);
    });

    it("drops a malformed diff param but still falls back to the recipe's own unmodified steps when recipe is valid", () => {
      const parsed = parseShareParams(
        `?brewType=Aeropress&ratio=${RECIPE_SOURCE.ratio}&water=${RECIPE_SOURCE.water}&coffee=${RECIPE_SOURCE.coffee}&oz=5.75&recipe=${RECIPE_SOURCE.recipeId}&diff=not-json`,
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.recipeSource).toEqual(RECIPE_SOURCE);
      // The diff is dropped, so brewSteps falls all the way back to the recipe's own steps, unmodified.
      expect(parsed?.brewSteps).toEqual({ steps: RECIPE_SOURCE.steps });
    });

    it("tolerates a syntactically-valid but wrong-shaped diff param, dropping brewSteps without casting blindly", () => {
      const wrongShaped = parseShareParams(
        `?brewType=Aeropress&ratio=9.44&water=170&coffee=18&oz=5.75&diff=${encodeURIComponent(
          JSON.stringify({ changed: "not-an-array" }),
        )}`,
      );
      expect(wrongShaped).not.toBeNull();
      expect("brewSteps" in (wrongShaped as object)).toBe(false);

      const numberShaped = parseShareParams(
        "?brewType=Aeropress&ratio=9.44&water=170&coffee=18&oz=5.75&diff=123",
      );
      expect(numberShaped).not.toBeNull();
      expect("brewSteps" in (numberShaped as object)).toBe(false);
    });
  });

  describe("shareBrew", () => {
    const brew = { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 };

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("uses the native share sheet with text built from the custom name when set", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share });

      const outcome = await shareBrew({ ...brew, name: "Sunday morning pour" });

      expect(outcome).toBe("shared");
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Sunday morning pour — 1:16 (30g coffee, 480g water)",
        }),
      );
    });

    it("falls back to the brewType in the share text when no name is set", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share });

      await shareBrew(brew);

      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Pour-over — 1:16 (30g coffee, 480g water)",
        }),
      );
    });

    it("falls back to copying the URL to the clipboard when navigator.share is unavailable", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });

      const outcome = await shareBrew(brew);

      expect(outcome).toBe("copied");
      expect(writeText).toHaveBeenCalledWith(buildShareUrl(brew));
    });
  });
});
