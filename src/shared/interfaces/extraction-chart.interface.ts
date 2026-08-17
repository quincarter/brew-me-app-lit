/** A single sample of a previously-recorded shot's curve, for the (currently unused) ghost-overlay comparison. */
export interface IExtractionGhostPoint {
  elapsedSeconds: number;
  pressureBar?: number;
  flowRateGramsPerSecond?: number;
  weightGrams?: number;
}
