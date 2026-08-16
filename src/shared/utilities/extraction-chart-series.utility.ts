import type {
  IBookooMonitorReading,
  IBookooScaleReading,
} from "../interfaces/bookoo-ble.interface";
import type { ITelemetrySample } from "../interfaces/telemetry.interface";
import type { IChartDomain, IChartPoint } from "./extraction-chart-path.utility";

/** Fixed y-domain ceilings shared by every extraction-chart rendering (live, sealed-shot replay, and ghost overlay) so they can't drift out of sync between call sites. */
export const PRESSURE_MAX_BAR = 10;
export const FLOW_MAX_GRAMS_PER_SECOND = 6;
export const MIN_WEIGHT_MAX_GRAMS = 20;

export interface IExtractionSeriesSet {
  pressurePoints: IChartPoint[];
  pressureDomain: IChartDomain;
  flowPoints: IChartPoint[];
  flowDomain: IChartDomain;
  weightPoints: IChartPoint[];
  weightDomain: IChartDomain;
}

/**
 * Shapes a set of scale/monitor telemetry samples (live or a sealed shot's own recorded
 * buffers) into per-metric chart points + fixed y-domains, ready for `buildExtractionChartPath`.
 * Elapsed seconds are computed relative to the earliest timestamp across BOTH sample arrays, so
 * a mixed-device set stays aligned on one shared time axis. Callers must guard against fewer
 * than 2 combined samples themselves (there's nothing meaningful to chart, and `Math.min()`/
 * `Math.max()` over two empty arrays would otherwise produce `Infinity`/`0` here).
 */
export const buildExtractionSeries = (
  scaleSamples: ITelemetrySample<IBookooScaleReading>[],
  monitorSamples: ITelemetrySample<IBookooMonitorReading>[],
): IExtractionSeriesSet => {
  const startTimestampMs = Math.min(
    ...scaleSamples.map((sample) => sample.timestampMs),
    ...monitorSamples.map((sample) => sample.timestampMs),
  );
  const elapsedSecondsOf = (timestampMs: number): number => (timestampMs - startTimestampMs) / 1000;
  const maxElapsedSeconds = Math.max(
    0,
    ...scaleSamples.map((sample) => elapsedSecondsOf(sample.timestampMs)),
    ...monitorSamples.map((sample) => elapsedSecondsOf(sample.timestampMs)),
  );

  const pressurePoints: IChartPoint[] = monitorSamples.map((sample) => ({
    elapsedSeconds: elapsedSecondsOf(sample.timestampMs),
    value: sample.reading.pressureBar,
  }));
  const flowPoints: IChartPoint[] = scaleSamples.map((sample) => ({
    elapsedSeconds: elapsedSecondsOf(sample.timestampMs),
    value: sample.reading.flowRateGramsPerSecond,
  }));
  const weightPoints: IChartPoint[] = scaleSamples.map((sample) => ({
    elapsedSeconds: elapsedSecondsOf(sample.timestampMs),
    value: sample.reading.weightGrams,
  }));
  const observedMaxWeight = Math.max(0, ...weightPoints.map((point) => point.value));

  const timeDomain = { minElapsedSeconds: 0, maxElapsedSeconds };

  return {
    pressurePoints,
    pressureDomain: { ...timeDomain, minValue: 0, maxValue: PRESSURE_MAX_BAR },
    flowPoints,
    flowDomain: { ...timeDomain, minValue: 0, maxValue: FLOW_MAX_GRAMS_PER_SECOND },
    weightPoints,
    weightDomain: {
      ...timeDomain,
      minValue: 0,
      maxValue: Math.max(MIN_WEIGHT_MAX_GRAMS, observedMaxWeight),
    },
  };
};
