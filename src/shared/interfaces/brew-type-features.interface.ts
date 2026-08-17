/** How the Timer screen's weight/pressure gauges and extraction chart are shown for a brew type. */
export type TelemetryDisplayMode = "off" | "full" | "chart-only";

/** Per-brew-type toggles for optional UI sections that don't make sense for every brew method. */
export interface IBrewTypeFeatures {
  /** Whether the Saved Detail screen's "Brews"/"Shots" section is shown for this brew type. */
  showShotsSection: boolean;
  /** Whether the Timer screen's device gauges and/or extraction chart are shown for this brew type. */
  telemetryMode: TelemetryDisplayMode;
}
