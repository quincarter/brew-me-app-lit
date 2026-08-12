import { signal } from "@lit-labs/preact-signals";
import { BREW_STEPS_PRESETS } from "../data/brew-steps-presets.data";
import type {
  IAeropressRecipe,
  IBrewStepsConfig,
  IChemexRecipe,
  ICleverDripperRecipe,
  IHarioSwitchRecipe,
  IKalitaWaveRecipe,
  ILoadedRecipeSource,
  IOrigamiRecipe,
  IV60Recipe,
} from "../interfaces/brew.interface";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "../utilities/aeropress-recipe.utility";
import {
  getPouroverRecipeLabel,
  getPouroverRecipeRatio,
  getPouroverRecipeSteps,
  parseDoseGrams,
  parseWaterGrams,
} from "../utilities/pourover-recipe.utility";
import { gramsToOunces } from "../utilities/ratio.utility";
import { coffeeSignal, ozSignal, ratioSignal, waterSignal } from "./calculator.store";

/**
 * Sentinel for "just calculate a ratio, no method chosen" - kept distinct
 * from `null`, which means the brew-type chooser hasn't been answered yet.
 * Picking this collapses the chooser without touching any of the signals
 * below, so the plain calculating flow stays exactly as it is today.
 */
export const QUICK_CALCULATOR = "__quick__";

/**
 * Ephemeral, mirrors `calculator.store.ts` - deliberately not persisted, so
 * it resets on reload along with the rest of the calculator session.
 * `null` = chooser not yet answered, `QUICK_CALCULATOR` = plain flow,
 * anything else = a real brew type.
 */
export const selectedBrewTypeSignal = signal<string | null>(null);

/** The live (possibly hand-edited) step sequence for this calculator session - `null` when no method with a preset (or the quick flow) is selected. */
export const brewStepsSignal = signal<IBrewStepsConfig | null>(null);

/** Set when the current numbers/steps were loaded from a curated recipe - drives the "Pulled from"/"Modified from" banner. */
export const loadedRecipeSourceSignal = signal<ILoadedRecipeSource | null>(null);

/** Answers the brew-type chooser: seeds the type's canned preset (if any) and clears any prior recipe-load provenance from a previously chosen type. */
export const selectBrewType = (type: string): void => {
  selectedBrewTypeSignal.value = type;
  brewStepsSignal.value = BREW_STEPS_PRESETS[type] ?? null;
  loadedRecipeSourceSignal.value = null;
};

/** A lighter reset than `clearBrewStepsState` - used by the Calculator's "Change" chip to re-open the brew-type chooser without touching the entered numbers. Whatever steps/recipe provenance were loaded stay put until a new type is actually picked via `selectBrewType`. */
export const reopenBrewTypeChooser = (): void => {
  selectedBrewTypeSignal.value = null;
};

/** Wholesale replace - used by `<brew-steps-card>`'s `config-change` event, a controlled component that doesn't own this signal itself. */
export const updateBrewStepsConfig = (config: IBrewStepsConfig): void => {
  brewStepsSignal.value = config;
};

/** Discards any hand edits and restores the current type's canned preset (or clears the card entirely for a type with none). */
export const resetBrewStepsToPreset = (): void => {
  const type = selectedBrewTypeSignal.value;
  brewStepsSignal.value = type ? (BREW_STEPS_PRESETS[type] ?? null) : null;
};

/**
 * Loads a curated WAC AeroPress recipe into the calculator: auto-fills
 * ratio/water/coffee from its hand-authored `doseGrams`/`totalWaterGrams`,
 * and snapshots its `setup`/step sequence as the Brew Steps card's rows so
 * the whole recipe (not just the numbers) is captured for reference.
 */
export const loadAeropressRecipeIntoCalculator = (recipe: IAeropressRecipe): void => {
  selectedBrewTypeSignal.value = "Aeropress";
  const ratio = getAeropressRecipeRatio(recipe);
  ratioSignal.value = String(ratio);
  waterSignal.value = String(recipe.totalWaterGrams);
  ozSignal.value = String(gramsToOunces(recipe.totalWaterGrams));
  coffeeSignal.value = recipe.doseGrams;

  const steps = getAeropressRecipeSteps(recipe);

  brewStepsSignal.value = { steps };
  loadedRecipeSourceSignal.value = {
    recipeId: recipe.id,
    label: getAeropressRecipeLabel(recipe),
    ratio,
    water: recipe.totalWaterGrams,
    coffee: recipe.doseGrams,
    steps,
  };
};

/** Loads a curated V60 recipe into the calculator. */
export const loadV60RecipeIntoCalculator = (recipe: IV60Recipe): void => {
  selectedBrewTypeSignal.value = "V60";
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  ratioSignal.value = String(ratio);
  waterSignal.value = String(water);
  ozSignal.value = String(gramsToOunces(water));
  coffeeSignal.value = dose;

  brewStepsSignal.value = { steps };
  loadedRecipeSourceSignal.value = {
    recipeId: recipe.id,
    label: getPouroverRecipeLabel(recipe),
    ratio,
    water,
    coffee: dose,
    steps,
  };
};

/** Loads a curated Origami recipe into the calculator. */
export const loadOrigamiRecipeIntoCalculator = (recipe: IOrigamiRecipe): void => {
  selectedBrewTypeSignal.value = "Origami";
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  ratioSignal.value = String(ratio);
  waterSignal.value = String(water);
  ozSignal.value = String(gramsToOunces(water));
  coffeeSignal.value = dose;

  brewStepsSignal.value = { steps };
  loadedRecipeSourceSignal.value = {
    recipeId: recipe.id,
    label: getPouroverRecipeLabel(recipe),
    ratio,
    water,
    coffee: dose,
    steps,
  };
};

/** Loads a curated Kalita Wave recipe into the calculator. */
export const loadKalitaWaveRecipeIntoCalculator = (recipe: IKalitaWaveRecipe): void => {
  selectedBrewTypeSignal.value = "Kalita Wave";
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  ratioSignal.value = String(ratio);
  waterSignal.value = String(water);
  ozSignal.value = String(gramsToOunces(water));
  coffeeSignal.value = dose;

  brewStepsSignal.value = { steps };
  loadedRecipeSourceSignal.value = {
    recipeId: recipe.id,
    label: getPouroverRecipeLabel(recipe),
    ratio,
    water,
    coffee: dose,
    steps,
  };
};

/** Loads a curated Chemex recipe into the calculator. */
export const loadChemexRecipeIntoCalculator = (recipe: IChemexRecipe): void => {
  selectedBrewTypeSignal.value = "Chemex";
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  ratioSignal.value = String(ratio);
  waterSignal.value = String(water);
  ozSignal.value = String(gramsToOunces(water));
  coffeeSignal.value = dose;

  brewStepsSignal.value = { steps };
  loadedRecipeSourceSignal.value = {
    recipeId: recipe.id,
    label: getPouroverRecipeLabel(recipe),
    ratio,
    water,
    coffee: dose,
    steps,
  };
};

/** Loads a curated Clever Dripper recipe into the calculator. */
export const loadCleverDripperRecipeIntoCalculator = (recipe: ICleverDripperRecipe): void => {
  selectedBrewTypeSignal.value = "Clever Dripper";
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  ratioSignal.value = String(ratio);
  waterSignal.value = String(water);
  ozSignal.value = String(gramsToOunces(water));
  coffeeSignal.value = dose;

  brewStepsSignal.value = { steps };
  loadedRecipeSourceSignal.value = {
    recipeId: recipe.id,
    label: getPouroverRecipeLabel(recipe),
    ratio,
    water,
    coffee: dose,
    steps,
  };
};

/** Loads a curated Hario Switch recipe into the calculator. */
export const loadHarioSwitchRecipeIntoCalculator = (recipe: IHarioSwitchRecipe): void => {
  selectedBrewTypeSignal.value = "Hario Switch";
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  ratioSignal.value = String(ratio);
  waterSignal.value = String(water);
  ozSignal.value = String(gramsToOunces(water));
  coffeeSignal.value = dose;

  brewStepsSignal.value = { steps };
  loadedRecipeSourceSignal.value = {
    recipeId: recipe.id,
    label: getPouroverRecipeLabel(recipe),
    ratio,
    water,
    coffee: dose,
    steps,
  };
};

/** Resets all three signals to their defaults - called from `calculator.store`'s `resetCalculator`/priming functions so a full reset also re-opens the brew-type chooser. */
export const clearBrewStepsState = (): void => {
  selectedBrewTypeSignal.value = null;
  brewStepsSignal.value = null;
  loadedRecipeSourceSignal.value = null;
};
