import { beforeEach, describe, expect, it } from "vitest";
import type {
  IBookooMonitorReading,
  IBookooScaleReading,
} from "../../interfaces/bookoo-ble.interface";
import {
  MAX_SAMPLES_PER_DEVICE,
  clearTelemetry,
  latestMonitorReadingSignal,
  latestScaleReadingSignal,
  monitorSamplesSignal,
  recordMonitorReading,
  recordScaleReading,
  scaleSamplesSignal,
} from "../telemetry.store";

const scaleReading = (weightGrams: number): IBookooScaleReading => ({
  timeMs: 0,
  weightGrams,
  flowRateGramsPerSecond: 0,
  batteryPercent: 90,
});

const monitorReading = (pressureBar: number): IBookooMonitorReading => ({
  pressureBar,
  batteryPercent: 90,
});

describe("telemetry.store", () => {
  beforeEach(() => {
    clearTelemetry();
  });

  describe("recordScaleReading", () => {
    it("appends a sample and updates the latest-reading computed", () => {
      expect(latestScaleReadingSignal.value).toBeNull();

      recordScaleReading(scaleReading(10));

      expect(scaleSamplesSignal.value).toHaveLength(1);
      expect(latestScaleReadingSignal.value).toEqual(scaleReading(10));
    });

    it("tracks the most recently recorded reading as latest", () => {
      recordScaleReading(scaleReading(10));
      recordScaleReading(scaleReading(20));

      expect(latestScaleReadingSignal.value).toEqual(scaleReading(20));
      expect(scaleSamplesSignal.value).toHaveLength(2);
    });

    it("caps the buffer at MAX_SAMPLES_PER_DEVICE, dropping the oldest sample first", () => {
      // Fill right up to the real exported cap, then push one more and confirm the oldest
      // sample was dropped (not the newest) and the array length stays capped.
      for (let i = 0; i < MAX_SAMPLES_PER_DEVICE; i++) {
        recordScaleReading(scaleReading(i));
      }
      expect(scaleSamplesSignal.value).toHaveLength(MAX_SAMPLES_PER_DEVICE);
      expect(scaleSamplesSignal.value[0]?.reading.weightGrams).toBe(0);

      recordScaleReading(scaleReading(MAX_SAMPLES_PER_DEVICE));

      expect(scaleSamplesSignal.value).toHaveLength(MAX_SAMPLES_PER_DEVICE);
      expect(scaleSamplesSignal.value[0]?.reading.weightGrams).toBe(1);
      expect(latestScaleReadingSignal.value).toEqual(scaleReading(MAX_SAMPLES_PER_DEVICE));
    });
  });

  describe("recordMonitorReading", () => {
    it("appends a sample and updates the latest-reading computed", () => {
      expect(latestMonitorReadingSignal.value).toBeNull();

      recordMonitorReading(monitorReading(9));

      expect(monitorSamplesSignal.value).toHaveLength(1);
      expect(latestMonitorReadingSignal.value).toEqual(monitorReading(9));
    });

    it("caps the buffer at MAX_SAMPLES_PER_DEVICE, dropping the oldest sample first", () => {
      for (let i = 0; i < MAX_SAMPLES_PER_DEVICE; i++) {
        recordMonitorReading(monitorReading(i));
      }
      recordMonitorReading(monitorReading(MAX_SAMPLES_PER_DEVICE));

      expect(monitorSamplesSignal.value).toHaveLength(MAX_SAMPLES_PER_DEVICE);
      expect(monitorSamplesSignal.value[0]?.reading.pressureBar).toBe(1);
      expect(latestMonitorReadingSignal.value).toEqual(monitorReading(MAX_SAMPLES_PER_DEVICE));
    });
  });

  it("keeps the scale and monitor buffers independent", () => {
    recordScaleReading(scaleReading(5));

    expect(scaleSamplesSignal.value).toHaveLength(1);
    expect(monitorSamplesSignal.value).toHaveLength(0);
    expect(latestMonitorReadingSignal.value).toBeNull();

    recordMonitorReading(monitorReading(3));

    expect(scaleSamplesSignal.value).toHaveLength(1);
    expect(monitorSamplesSignal.value).toHaveLength(1);
  });

  describe("clearTelemetry", () => {
    it("empties both buffers and resets latest-reading computeds to null", () => {
      recordScaleReading(scaleReading(1));
      recordMonitorReading(monitorReading(1));

      clearTelemetry();

      expect(scaleSamplesSignal.value).toEqual([]);
      expect(monitorSamplesSignal.value).toEqual([]);
      expect(latestScaleReadingSignal.value).toBeNull();
      expect(latestMonitorReadingSignal.value).toBeNull();
    });
  });
});
