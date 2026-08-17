import type { ITelemetrySample } from "./telemetry.interface";
import type { IBookooMonitorReading, IBookooScaleReading } from "./bookoo-ble.interface";

/** One completed, sealed brewing session recorded against a saved brew (ISavedBrew) - a brew ratio is 1:many with its shots. */
export interface IBrewShot {
  id: number;
  /** `ISavedBrew.id` this shot was pulled/brewed against. */
  savedBrewId: number;
  /** Epoch ms when this shot was sealed via stopSession(). */
  createdAt: number;
  /** Elapsed timer seconds when the session was sealed (timerSecondsSignal.value at that point). */
  elapsedSeconds: number;
  /** Sealed telemetry captured during this shot, if any device was connected. Empty arrays when nothing was connected. */
  scaleSamples: ITelemetrySample<IBookooScaleReading>[];
  monitorSamples: ITelemetrySample<IBookooMonitorReading>[];
}
