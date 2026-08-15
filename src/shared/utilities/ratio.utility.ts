export const GRAMS_PER_OUNCE = 28.3495;
export const OUNCES_PER_GRAM = 0.035274;

export const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Rounds to 1 decimal, e.g. for displaying an espresso ratio like "1:2.4". */
export const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Converts grams of water to fluid ounces, rounded to 2 decimals. */
export const gramsToOunces = (grams: number): number => round2(grams * OUNCES_PER_GRAM);

/** Converts fluid ounces to whole grams of water. */
export const ouncesToGrams = (ounces: number): number => Math.round(ounces * GRAMS_PER_OUNCE);

/** Coffee (g) needed for a given amount of water (g) at a water:coffee ratio. */
export const coffeeForWater = (waterGrams: number, ratio: number): number | null => {
  if (Number.isNaN(waterGrams) || !ratio) return null;
  return round2(waterGrams / ratio);
};
