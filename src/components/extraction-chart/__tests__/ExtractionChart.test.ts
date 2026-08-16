import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  IBookooMonitorReading,
  IBookooScaleReading,
} from "../../../shared/interfaces/bookoo-ble.interface";
import type { IExtractionGhostPoint } from "../../../shared/interfaces/extraction-chart.interface";
import { anyDeviceConnectedThisSessionSignal } from "../../../shared/stores/device-connection.store";
import {
  clearTelemetry,
  recordMonitorReading,
  recordScaleReading,
  startTelemetryRecording,
} from "../../../shared/stores/telemetry.store";
import "../brew-extraction-chart";
import type { ExtractionChart } from "../ExtractionChart";

const scaleReading = (overrides: Partial<IBookooScaleReading> = {}): IBookooScaleReading => ({
  timeMs: 0,
  weightGrams: 10,
  flowRateGramsPerSecond: 1,
  batteryPercent: 90,
  ...overrides,
});

const monitorReading = (overrides: Partial<IBookooMonitorReading> = {}): IBookooMonitorReading => ({
  pressureBar: 9,
  batteryPercent: 90,
  ...overrides,
});

describe("brew-extraction-chart", () => {
  let element: ExtractionChart;

  beforeEach(async () => {
    clearTelemetry();
    startTelemetryRecording();
    // Most tests below are about behavior once a device HAS connected this session (the
    // waiting/series/ghost states) - the dedicated "never connected" describe block below
    // overrides this back to false for its own cases.
    anyDeviceConnectedThisSessionSignal.value = true;
    element = document.createElement("brew-extraction-chart") as ExtractionChart;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    clearTelemetry();
    anyDeviceConnectedThisSessionSignal.value = false;
  });

  describe("never connected this session", () => {
    it("renders an invitation to connect a device instead of the waiting/chart states, even with no telemetry recorded", async () => {
      anyDeviceConnectedThisSessionSignal.value = false;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".placeholder")?.textContent?.trim()).toBe(
        "Connect a scale or espresso monitor to get live feedback about your shots",
      );
      expect(element.shadowRoot?.querySelector(".chart-svg")).toBeNull();
    });

    it("takes priority over the waiting-for-data state even if telemetry samples somehow exist", async () => {
      recordScaleReading(scaleReading());
      recordScaleReading(scaleReading());
      anyDeviceConnectedThisSessionSignal.value = false;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".placeholder")?.textContent?.trim()).toBe(
        "Connect a scale or espresso monitor to get live feedback about your shots",
      );
      expect(element.shadowRoot?.querySelector(".chart-svg")).toBeNull();
    });
  });

  describe("empty state", () => {
    it("renders the waiting placeholder with no recorded telemetry", () => {
      expect(element.shadowRoot?.querySelector(".placeholder")?.textContent?.trim()).toBe(
        "Waiting for data…",
      );
      expect(element.shadowRoot?.querySelector(".chart-svg")).toBeNull();
    });

    it("still renders the placeholder with only a single combined sample", async () => {
      recordScaleReading(scaleReading());
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".placeholder")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".chart-svg")).toBeNull();
    });
  });

  describe("series rendering", () => {
    it("renders the legend, svg, and three series paths once >= 2 combined samples exist", async () => {
      recordScaleReading(scaleReading({ weightGrams: 5 }));
      recordScaleReading(scaleReading({ weightGrams: 10 }));
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".placeholder")).toBeNull();
      expect(element.shadowRoot?.querySelector(".chart-svg")).not.toBeNull();
      expect(element.shadowRoot?.querySelectorAll(".legend-chip")).toHaveLength(3);

      const paths = element.shadowRoot?.querySelectorAll(".series-path");
      expect(paths).toHaveLength(3);
      expect(element.shadowRoot?.querySelector(".series-path.pressure")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".series-path.flow")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".series-path.weight")).not.toBeNull();
    });

    it("renders with one scale sample and one monitor sample combined (mixed-device case)", async () => {
      recordScaleReading(scaleReading());
      recordMonitorReading(monitorReading());
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".placeholder")).toBeNull();
      expect(element.shadowRoot?.querySelectorAll(".series-path")).toHaveLength(3);
    });

    it("draws a non-empty path 'd' attribute for the weight series once there are >= 2 scale samples", async () => {
      recordScaleReading(scaleReading({ weightGrams: 5 }));
      recordScaleReading(scaleReading({ weightGrams: 15 }));
      await element.updateComplete;

      const weightPath = element.shadowRoot?.querySelector(".series-path.weight");
      expect(weightPath?.getAttribute("d")).toMatch(/^M/);
    });
  });

  describe("ghost overlay", () => {
    it("does not render a ghost overlay when ghostCurve is null (the default)", async () => {
      recordScaleReading(scaleReading());
      recordScaleReading(scaleReading());
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".ghost-path")).toBeNull();
      expect(element.shadowRoot?.querySelector(".ghost-caption-row")).toBeNull();
    });

    it("does not render a ghost overlay when ghostCurve has fewer than 2 points", async () => {
      recordScaleReading(scaleReading());
      recordScaleReading(scaleReading());
      element.ghostCurve = [{ elapsedSeconds: 0, weightGrams: 5 }];
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".ghost-path")).toBeNull();
      expect(element.shadowRoot?.querySelector(".ghost-caption-row")).toBeNull();
    });

    it("renders dashed ghost path(s) and a caption with ghostLabel when ghostCurve has >= 2 points", async () => {
      recordScaleReading(scaleReading());
      recordScaleReading(scaleReading());
      const ghostCurve: IExtractionGhostPoint[] = [
        { elapsedSeconds: 0, weightGrams: 0, pressureBar: 0, flowRateGramsPerSecond: 0 },
        { elapsedSeconds: 10, weightGrams: 20, pressureBar: 9, flowRateGramsPerSecond: 2 },
      ];
      element.ghostCurve = ghostCurve;
      element.ghostLabel = "Yesterday's shot";
      await element.updateComplete;

      const ghostPaths = element.shadowRoot?.querySelectorAll(".ghost-path");
      expect(ghostPaths?.length).toBeGreaterThan(0);
      const captionRow = element.shadowRoot?.querySelector(".ghost-caption-row");
      expect(captionRow).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".ghost-caption")?.textContent).toContain(
        "Yesterday's shot",
      );
    });
  });
});
