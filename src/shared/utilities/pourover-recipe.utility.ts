import type {
  IBrewStep,
  IChemexRecipe,
  ICleverDripperRecipe,
  IHarioSwitchRecipe,
  IKalitaWaveRecipe,
  IOrigamiRecipe,
  IV60Recipe,
} from "../interfaces/brew.interface";
import { round2 } from "./ratio.utility";

export type IPouroverRecipe =
  | IV60Recipe
  | IOrigamiRecipe
  | IKalitaWaveRecipe
  | IChemexRecipe
  | ICleverDripperRecipe
  | IHarioSwitchRecipe;

/** "{author} — {title}" - display label used for a pour-over recipe reference banner and provenance. */
export const getPouroverRecipeLabel = (recipe: IPouroverRecipe): string =>
  `${recipe.author} — ${recipe.title}`;

export const parseDoseGrams = (recipe: IPouroverRecipe): number => {
  const str = recipe.setup.Dose ?? "";
  const match = str.match(/([0-9.]+)/);
  return match ? Number.parseFloat(match[1]) : 15;
};

export const parseWaterGrams = (recipe: IPouroverRecipe): number => {
  const str = recipe.setup.Water ?? "";
  const numbers = str.match(/\d+(\.\d+)?/g);
  if (!numbers || numbers.length === 0) return 250;
  if (str.includes("+") && numbers.length >= 2) {
    return numbers.slice(0, 2).reduce((sum, n) => sum + Number.parseFloat(n), 0);
  }
  return Number.parseFloat(numbers[0]);
};

export const getPouroverRecipeRatio = (recipe: IPouroverRecipe): number => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  return round2(water / dose);
};

export const getPouroverRecipeSteps = (recipe: IPouroverRecipe): IBrewStep[] => {
  const setupSteps: IBrewStep[] = Object.entries(recipe.setup).map(([key, value]) => ({
    id: `${recipe.id}-setup-${key}`,
    label: key,
    kind: "note",
    value,
  }));
  const brewSteps: IBrewStep[] =
    recipe.timedSteps ??
    recipe.steps.map((step, index) => ({
      id: `${recipe.id}-step-${index}`,
      label: `Step ${index + 1}`,
      kind: "note",
      value: step,
      seconds: null,
    }));
  return [...setupSteps, ...brewSteps];
};
