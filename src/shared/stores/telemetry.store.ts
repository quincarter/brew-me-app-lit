import { signal } from "@lit-labs/preact-signals";
import type {
  IBookooMonitorReading,
  IBookooScaleReading,
} from "../interfaces/bookoo-ble.interface";
import type { ITelemetrySample } from "../interfaces/telemetry.interface";

/**
 * Bookoo notifications arrive roughly every ~100ms (~10Hz), so 6000 samples
 * is ~10 minutes per device - generous headroom for any realistic
 * pour-over or espresso session while keeping the buffer bounded.
 */
export const MAX_SAMPLES_PER_DEVICE = 6000;

export const scaleSamplesSignal = signal<ITelemetrySample<IBookooScaleReading>[]>([]);
export const monitorSamplesSignal = signal<ITelemetrySample<IBookooMonitorReading>[]>([]);

/** True once `sealTelemetry()` freezes the current session's samples - a late BLE notification arriving after `stopSession()` must not keep appending to a shot that's already been recorded. */
export const telemetrySealedSignal = signal(false);

/**
 * True only while a brewing session is actually running - a connected device streams
 * notifications continuously regardless of the timer, so without this gate the buffers (and
 * the extraction chart reading them) would start filling the instant a device pairs, long
 * before anyone taps Play, and never stop on their own. Set by `startTelemetryRecording()`
 * (called from `toggleTimer`'s start branch) and cleared by `clearTelemetry()`.
 */
export const telemetryRecordingSignal = signal(false);

/** Starts accepting readings into the buffers - the counterpart to a brewing session's Play tap. A no-op if nothing's connected, since then nothing calls `recordScaleReading`/`recordMonitorReading` anyway. */
export const startTelemetryRecording = (): void => {
  telemetryRecordingSignal.value = true;
};

/** Freezes the current telemetry buffers - called by `stopSession()` before the sealed samples are read off for the shot record. */
export const sealTelemetry = (): void => {
  telemetrySealedSignal.value = true;
};

/**
 * The most recent reading from a connected device, updated on every BLE notification
 * regardless of whether a brewing session is actively recording - a connected scale/monitor
 * should always drive the stat-tile readout (e.g. resting weight, ambient pressure), not just
 * during the Play-to-Stop/Seal recording window that gates `scaleSamplesSignal`/
 * `monitorSamplesSignal` below. Deliberately NOT reset by `clearTelemetry()` - it reflects the
 * device's current live state, not "this session's recorded data".
 */
export const latestScaleReadingSignal = signal<IBookooScaleReading | null>(null);
export const latestMonitorReadingSignal = signal<IBookooMonitorReading | null>(null);

export const recordScaleReading = (reading: IBookooScaleReading): void => {
  latestScaleReadingSignal.value = reading;
  if (!telemetryRecordingSignal.value || telemetrySealedSignal.value) return;
  scaleSamplesSignal.value = [
    ...scaleSamplesSignal.value,
    { timestampMs: Date.now(), reading },
  ].slice(-MAX_SAMPLES_PER_DEVICE);
};

export const recordMonitorReading = (reading: IBookooMonitorReading): void => {
  latestMonitorReadingSignal.value = reading;
  if (!telemetryRecordingSignal.value || telemetrySealedSignal.value) return;
  monitorSamplesSignal.value = [
    ...monitorSamplesSignal.value,
    { timestampMs: Date.now(), reading },
  ].slice(-MAX_SAMPLES_PER_DEVICE);
};

/**
 * Per-session reset hook - clears the recorded buffers, un-seals, and stops recording (so the
 * next session only starts once Play is tapped again), e.g. when the timer clock resets to 0.
 * Leaves `latestScaleReadingSignal`/`latestMonitorReadingSignal` alone (see their doc comment).
 */
export const clearTelemetry = (): void => {
  scaleSamplesSignal.value = [];
  monitorSamplesSignal.value = [];
  telemetrySealedSignal.value = false;
  telemetryRecordingSignal.value = false;
};
