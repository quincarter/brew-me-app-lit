import { computed, signal } from "@lit-labs/preact-signals";
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

/** Freezes the current telemetry buffers - called by `stopSession()` before the sealed samples are read off for the shot record. */
export const sealTelemetry = (): void => {
  telemetrySealedSignal.value = true;
};

export const latestScaleReadingSignal = computed(() => {
  const samples = scaleSamplesSignal.value;
  return samples[samples.length - 1]?.reading ?? null;
});
export const latestMonitorReadingSignal = computed(() => {
  const samples = monitorSamplesSignal.value;
  return samples[samples.length - 1]?.reading ?? null;
});

export const recordScaleReading = (reading: IBookooScaleReading): void => {
  if (telemetrySealedSignal.value) return;
  scaleSamplesSignal.value = [
    ...scaleSamplesSignal.value,
    { timestampMs: Date.now(), reading },
  ].slice(-MAX_SAMPLES_PER_DEVICE);
};

export const recordMonitorReading = (reading: IBookooMonitorReading): void => {
  if (telemetrySealedSignal.value) return;
  monitorSamplesSignal.value = [
    ...monitorSamplesSignal.value,
    { timestampMs: Date.now(), reading },
  ].slice(-MAX_SAMPLES_PER_DEVICE);
};

/** Per-session reset hook - clears both buffers and un-seals recording, e.g. when the timer clock resets to 0. */
export const clearTelemetry = (): void => {
  scaleSamplesSignal.value = [];
  monitorSamplesSignal.value = [];
  telemetrySealedSignal.value = false;
};
