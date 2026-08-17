import { describe, expect, it } from "vitest";
import type {
  IBookooMonitorReading,
  IBookooScaleReading,
} from "../../interfaces/bookoo-ble.interface";
import type { ITelemetrySample } from "../../interfaces/telemetry.interface";
import { REAL_LONG_SCALE_ONLY_SHOT } from "./fixtures/real-device-export.fixture";
import { buildExtractionSeries, MIN_WEIGHT_MAX_GRAMS } from "../extraction-chart-series.utility";

const scaleSample = (
  timestampMs: number,
  overrides: Partial<IBookooScaleReading> = {},
): ITelemetrySample<IBookooScaleReading> => ({
  timestampMs,
  reading: {
    timeMs: timestampMs,
    weightGrams: 10,
    flowRateGramsPerSecond: 1,
    batteryPercent: 90,
    ...overrides,
  },
});

const monitorSample = (
  timestampMs: number,
  overrides: Partial<IBookooMonitorReading> = {},
): ITelemetrySample<IBookooMonitorReading> => ({
  timestampMs,
  reading: { pressureBar: 9, batteryPercent: 90, ...overrides },
});

describe("buildExtractionSeries", () => {
  it("computes elapsed seconds relative to the earliest timestamp across both sample arrays", () => {
    const result = buildExtractionSeries(
      [scaleSample(1000, { weightGrams: 5 }), scaleSample(3000, { weightGrams: 15 })],
      [monitorSample(2000, { pressureBar: 6 })],
    );

    expect(result.weightPoints).toEqual([
      { elapsedSeconds: 0, value: 5 },
      { elapsedSeconds: 2, value: 15 },
    ]);
    expect(result.pressurePoints).toEqual([{ elapsedSeconds: 1, value: 6 }]);
    expect(result.pressureDomain.maxElapsedSeconds).toBe(2);
  });

  it("maps scale samples to both flow and weight points, and monitor samples to pressure points", () => {
    const result = buildExtractionSeries(
      [scaleSample(0, { weightGrams: 8, flowRateGramsPerSecond: 1.5 })],
      [monitorSample(0, { pressureBar: 7 })],
    );

    expect(result.flowPoints).toEqual([{ elapsedSeconds: 0, value: 1.5 }]);
    expect(result.weightPoints).toEqual([{ elapsedSeconds: 0, value: 8 }]);
    expect(result.pressurePoints).toEqual([{ elapsedSeconds: 0, value: 7 }]);
  });

  it("uses fixed y-domains for pressure (0-10 bar) and flow (0-6 g/s) regardless of observed values", () => {
    const result = buildExtractionSeries(
      [
        scaleSample(0, { flowRateGramsPerSecond: 1 }),
        scaleSample(1000, { flowRateGramsPerSecond: 1 }),
      ],
      [monitorSample(0, { pressureBar: 1 }), monitorSample(1000, { pressureBar: 1 })],
    );

    expect(result.pressureDomain).toMatchObject({ minValue: 0, maxValue: 10 });
    expect(result.flowDomain).toMatchObject({ minValue: 0, maxValue: 6 });
  });

  it("widens the weight domain to the observed max when it exceeds the 20g floor", () => {
    const result = buildExtractionSeries(
      [scaleSample(0, { weightGrams: 5 }), scaleSample(1000, { weightGrams: 42 })],
      [],
    );

    expect(result.weightDomain).toMatchObject({ minValue: 0, maxValue: 42 });
  });

  it("keeps the weight domain at the 20g floor when observed weight is smaller", () => {
    const result = buildExtractionSeries(
      [scaleSample(0, { weightGrams: 2 }), scaleSample(1000, { weightGrams: 4 })],
      [],
    );

    expect(result.weightDomain).toMatchObject({ minValue: 0, maxValue: 20 });
  });

  it("shapes a real ~1500-sample scale capture without producing NaN/Infinity points or domains", () => {
    const result = buildExtractionSeries(
      REAL_LONG_SCALE_ONLY_SHOT.scaleSamples,
      REAL_LONG_SCALE_ONLY_SHOT.monitorSamples,
    );

    expect(result.weightPoints).toHaveLength(REAL_LONG_SCALE_ONLY_SHOT.scaleSamples.length);
    expect(result.flowPoints).toHaveLength(REAL_LONG_SCALE_ONLY_SHOT.scaleSamples.length);
    expect(result.pressurePoints).toEqual([]);

    for (const point of [...result.weightPoints, ...result.flowPoints]) {
      expect(Number.isFinite(point.elapsedSeconds)).toBe(true);
      expect(Number.isFinite(point.value)).toBe(true);
    }
    expect(result.weightDomain.maxElapsedSeconds).toBeGreaterThan(0);
    expect(result.weightDomain.maxValue).toBeGreaterThanOrEqual(MIN_WEIGHT_MAX_GRAMS);
  });
});
