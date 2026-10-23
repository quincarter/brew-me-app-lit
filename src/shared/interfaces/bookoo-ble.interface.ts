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

/**
 * A decoded Bookoo Ultra Scale powder-weight notification (`0xFF11`, packet type `0x0F`).
 * Beta firmware V3.2.4+ / release firmware V4.0.0+ only.
 */
export interface IBookooScalePowderWeightReading {
  /** Signed powder (dose) weight in grams. */
  powderWeightGrams: number;
}

/** The automatic-mode lifecycle events a Bookoo Ultra Scale reports in packet type `0x0D`. */
export type BookooAutomaticModeEventType = "stopped" | "started" | "ready" | "exitReady" | "exitDone";

/**
 * A decoded Bookoo Ultra Scale automatic-mode event/settlement notification (`0xFF11`, packet
 * type `0x0D`). Beta firmware V3.2.4+ / release firmware V4.0.0+ only.
 */
export interface IBookooScaleAutomaticModeEvent {
  eventType: BookooAutomaticModeEventType;
  /** Scale's internal elapsed timer at the time of this event, in milliseconds. */
  timeMs: number;
  /** Signed weight in grams at the time of this event. */
  weightGrams: number;
  /** Average flow rate (timing-mode settlement) or liquid:powder ratio (ratio-mode settlement). */
  result: number;
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
