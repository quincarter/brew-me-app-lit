import { computed } from "@lit-labs/preact-signals";
import type {
  IAeropressExpertRecipe,
  IAeropressRecipe,
  IChemexRecipe,
  ICleverDripperRecipe,
  IEspressoProfile,
  IEspressoShotStyle,
  IHarioSwitchRecipe,
  IKalitaWaveRecipe,
  IOrigamiRecipe,
  IShareableBrew,
  ISavedBrew,
  IV60Recipe,
} from "../interfaces/brew.interface";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "../utilities/aeropress-recipe.utility";
import {
  getEspressoRecipeLabel,
  getEspressoRecipeSteps,
} from "../utilities/espresso-recipe.utility";
import {
  getPouroverRecipeLabel,
  getPouroverRecipeRatio,
  getPouroverRecipeSteps,
  parseDoseGrams,
  parseWaterGrams,
} from "../utilities/pourover-recipe.utility";
import { gramsToOunces } from "../utilities/ratio.utility";
import { persistentSignal } from "./persistent-signal";
import { openPostSaveSheet } from "./post-save-sheet.store";
import { recordSyncTombstone } from "./sync-tombstones.store";

/** No seed data - a fresh install starts with nothing saved. */
export const savedBrewsSignal = persistentSignal<ISavedBrew[]>([], { key: "saved-brews" });

export const totalBrewsSignal = computed(() => savedBrewsSignal.value.length);

/** Number of most-recently-active brews surfaced by recentSavedBrewsSignal. */
const RECENT_BREWS_LIMIT = 4;

/**
 * All saved brews sorted with the most recently active brews first (by `lastBrewedAt` falling back to `createdAt`).
 */
export const sortedSavedBrewsSignal = computed(() =>
  [...savedBrewsSignal.value].sort(
    (a, b) => (b.lastBrewedAt ?? b.createdAt) - (a.lastBrewedAt ?? a.createdAt),
  ),
);

/**
 * The most recently *active* brews, newest first, capped for "Recent brews"
 * style sections - ordered by `lastBrewedAt` (falling back to `createdAt`
 * for a brew that's never been re-brewed), not by save order, so re-brewing
 * an older saved ratio surfaces it here again.
 */
export const recentSavedBrewsSignal = computed(() =>
  sortedSavedBrewsSignal.value.slice(0, RECENT_BREWS_LIMIT),
);

/** The single most recently brewed saved brew, or null when nothing's saved yet - drives Home's featured "Brew again" card. */
export const mostRecentlyBrewedSignal = computed(() => recentSavedBrewsSignal.value[0] ?? null);

const dayKey = (timestamp: number): string => new Date(timestamp).toDateString();

/**
 * Real (not mocked) day streak: consecutive calendar days, ending today,
 * with at least one ratio saved. Saving nothing today resets it to 0, same
 * as typical daily-streak semantics.
 */
export const streakDaysSignal = computed(() => {
  const savedDays = new Set(savedBrewsSignal.value.map((brew) => dayKey(brew.createdAt)));
  if (savedDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (savedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
});

export const getSavedBrewById = (id: number): ISavedBrew | undefined =>
  savedBrewsSignal.value.find((brew) => brew.id === id);

export const addSavedBrew = (brew: IShareableBrew): ISavedBrew => {
  const now = Date.now();
  const savedBrew = { ...brew, id: now, createdAt: now, updatedAt: now };
  savedBrewsSignal.value = [...savedBrewsSignal.value, savedBrew];
  return savedBrew;
};

export const updateSavedBrew = (id: number, patch: Partial<Omit<ISavedBrew, "id">>): void => {
  savedBrewsSignal.value = savedBrewsSignal.value.map((brew) =>
    brew.id === id ? { ...brew, ...patch, updatedAt: Date.now() } : brew,
  );
};

export const deleteSavedBrew = (id: number): void => {
  recordSyncTombstone(id);
  savedBrewsSignal.value = savedBrewsSignal.value.filter((brew) => brew.id !== id);
};

/** Stamps a brew as brewed right now - used by "Brew again" so recency ordering reflects actual use, not just save order. */
export const markBrewedNow = (id: number): void => {
  updateSavedBrew(id, { lastBrewedAt: Date.now() });
};

/**
 * The "Brew again" action, available from Home, Saved Brews, Saved Ratio
 * Detail, and the Calculator's own recent-brews strip: stamps the brew as
 * brewed now and opens the post-save sheet so the user can jump into a
 * guided timer or view the brew's detail - without routing back through
 * Save, which would create a duplicate entry instead of updating this one.
 */
export const brewAgain = (brew: ISavedBrew, options?: { alreadyOnDetail?: boolean }): void => {
  markBrewedNow(brew.id);
  openPostSaveSheet(brew, options);
};

/**
 * The "Brew this recipe now" action on the WAC Recipes screen: saves a
 * curated AeroPress recipe as a brand-new brew (auto-filled numbers, its
 * curated step sequence, and recipe provenance for the "Pulled from"
 * banner), then opens the post-save sheet so the user can jump straight
 * into a guided timer or view the new brew's detail screen.
 */
export const brewAeropressRecipeNow = (recipe: IAeropressRecipe): void => {
  const ratio = getAeropressRecipeRatio(recipe);
  const steps = getAeropressRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Aeropress",
    name: `${recipe.competitor} · ${recipe.year}`,
    ratio,
    water: recipe.totalWaterGrams,
    coffee: recipe.doseGrams,
    oz: gramsToOunces(recipe.totalWaterGrams),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getAeropressRecipeLabel(recipe),
      ratio,
      water: recipe.totalWaterGrams,
      coffee: recipe.doseGrams,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/**
 * Saves a curated named-creator AeroPress recipe (not a WAC entry - see
 * `brewAeropressRecipeNow`) as a brand-new brew and opens the post-save
 * sheet.
 */
export const brewAeropressExpertRecipeNow = (recipe: IAeropressExpertRecipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Aeropress",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated V60 recipe as a brand-new brew and opens post-save sheet. */
export const brewV60RecipeNow = (recipe: IV60Recipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "V60",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated Origami recipe as a brand-new brew and opens post-save sheet. */
export const brewOrigamiRecipeNow = (recipe: IOrigamiRecipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Origami",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated Kalita Wave recipe as a brand-new brew and opens post-save sheet. */
export const brewKalitaWaveRecipeNow = (recipe: IKalitaWaveRecipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Kalita Wave",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated Chemex recipe as a brand-new brew and opens post-save sheet. */
export const brewChemexRecipeNow = (recipe: IChemexRecipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Chemex",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated Clever Dripper recipe as a brand-new brew and opens post-save sheet. */
export const brewCleverDripperRecipeNow = (recipe: ICleverDripperRecipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Clever Dripper",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated Hario Switch recipe as a brand-new brew and opens post-save sheet. */
export const brewHarioSwitchRecipeNow = (recipe: IHarioSwitchRecipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Hario Switch",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/**
 * The "Brew now" action on the Espresso Recipes screen: saves a curated
 * shot style or profile as a brand-new brew, then opens the post-save
 * sheet. Distinguishes the two by the presence of `preinfusionSec`, which
 * only `IEspressoProfile` carries - a plain `IEspressoShotStyle` falls back
 * to the same style-wide preinfusion/grind/water-temp defaults used by
 * `loadEspressoShotStyleIntoCalculator`.
 */
export const brewEspressoRecipeNow = (recipe: IEspressoShotStyle | IEspressoProfile): void => {
  const steps = getEspressoRecipeSteps(recipe);
  const label = getEspressoRecipeLabel(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Espresso Shot",
    name: label,
    ratio: recipe.ratio,
    water: recipe.doseOut,
    coffee: recipe.doseIn,
    oz: gramsToOunces(recipe.doseOut),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label,
      ratio: recipe.ratio,
      water: recipe.doseOut,
      coffee: recipe.doseIn,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Danger-zone reset: clears every saved ratio. Used by the Settings screen. Records a tombstone per brew so a cloud sync pull doesn't resurrect them. */
export const deleteAllSavedBrews = (): void => {
  savedBrewsSignal.value.forEach((brew) => recordSyncTombstone(brew.id));
  savedBrewsSignal.value = [];
};
