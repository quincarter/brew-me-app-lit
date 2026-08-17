import type { IBrewShot } from "../../../interfaces/shot.interface";
// The checked-in real device export also used by e2e/shot-history-import.spec.ts - imported as
// JSON (not read via node:fs) so this file stays within the browser-app `src` type-checking
// surface, which has no Node types configured.
import realDeviceExport from "../../../../../e2e/brew-me-export-2026-08-16-data-with-brews-and-shots.json";

/**
 * A real export captured from a connected scale - loaded here so store/component/utility unit
 * tests can exercise genuinely noisy real telemetry (drifting flow readings, scale-only captures
 * with no pressure monitor, hundreds-to-thousands of samples per shot) instead of only hand-built
 * synthetic data.
 */
export const REAL_SAVED_SHOTS: IBrewShot[] = realDeviceExport.data["saved-shots"] as IBrewShot[];

/** The full raw export, re-serialized - for tests exercising the import/export utilities themselves. */
export const REAL_DEVICE_EXPORT_RAW: string = JSON.stringify(realDeviceExport);

/**
 * Ground truth read directly from the fixture: how many sealed shots/brews were recorded against
 * each saved brew id, including the one saved brew that was never brewed (0 shots).
 */
export const REAL_SHOT_COUNTS_BY_SAVED_BREW_ID: Record<number, number> = {
  1786844237737: 4,
  1786877819002: 0,
  1786927327303: 3,
  1786927564442: 2,
  1786927977198: 1,
};

const findShot = (id: number): IBrewShot => {
  const shot = REAL_SAVED_SHOTS.find((candidate) => candidate.id === id);
  if (!shot) throw new Error(`Fixture shot ${id} not found in real-device-export.fixture.ts`);
  return shot;
};

/** The longest-running real capture in the fixture (145s / 1446 scale samples, 0 monitor samples - scale-only, no pressure gauge connected). */
export const REAL_LONG_SCALE_ONLY_SHOT: IBrewShot = findShot(1786928479724);
