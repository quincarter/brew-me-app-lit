/** A decoded Bookoo Scale weight-data notification (`0xFF11`, packet type `0x0B`). */
export interface IBookooScaleReading {
  /** Scale's internal elapsed timer, in milliseconds. */
  timeMs: number;
  /** Signed weight in grams. */
  weightGrams: number;
  /** Signed flow rate in grams/second. */
  flowRateGramsPerSecond: number;
  /** Remaining battery, 0-100. */
  batteryPercent: number;
}

/** A decoded Bookoo Espresso Monitor extraction-data notification (`0xFF02`, packet type `0x1B`). */
export interface IBookooMonitorReading {
  /** Pressure in bar. */
  pressureBar: number;
  /** Remaining battery, 0-100. */
  batteryPercent: number;
}

/** Connection lifecycle for a `BookooScaleConnection`/`BookooMonitorConnection`. */
export type BookooConnectionState = "disconnected" | "connecting" | "connected";
