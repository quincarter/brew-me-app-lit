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

export const latestScaleReadingSignal = computed(() => {
  const samples = scaleSamplesSignal.value;
  return samples[samples.length - 1]?.reading ?? null;
});
export const latestMonitorReadingSignal = computed(() => {
  const samples = monitorSamplesSignal.value;
  return samples[samples.length - 1]?.reading ?? null;
});

export const recordScaleReading = (reading: IBookooScaleReading): void => {
  scaleSamplesSignal.value = [
    ...scaleSamplesSignal.value,
    { timestampMs: Date.now(), reading },
  ].slice(-MAX_SAMPLES_PER_DEVICE);
};

export const recordMonitorReading = (reading: IBookooMonitorReading): void => {
  monitorSamplesSignal.value = [
    ...monitorSamplesSignal.value,
    { timestampMs: Date.now(), reading },
  ].slice(-MAX_SAMPLES_PER_DEVICE);
};

/** Per-session reset hook - clears both buffers, e.g. when the timer clock resets to 0. */
export const clearTelemetry = (): void => {
  scaleSamplesSignal.value = [];
  monitorSamplesSignal.value = [];
};
