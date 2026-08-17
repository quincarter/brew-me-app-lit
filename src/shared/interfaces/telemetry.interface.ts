/** A single locally-timestamped BLE reading, captured whenever the underlying characteristic fires. */
export interface ITelemetrySample<TReading> {
  /** `Date.now()` when the sample was recorded locally (not the device's own onboard clock). */
  timestampMs: number;
  reading: TReading;
}
