import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IBrewShot } from "../../../shared/interfaces/shot.interface";
import "../brew-shot-list";
import type { ShotList } from "../ShotList";

const shot = (overrides: Partial<IBrewShot> = {}): IBrewShot => ({
  id: 1,
  savedBrewId: 1,
  createdAt: Date.now(),
  elapsedSeconds: 95,
  scaleSamples: [],
  monitorSamples: [],
  ...overrides,
});

describe("brew-shot-list", () => {
  let element: ShotList;

  beforeEach(async () => {
    element = document.createElement("brew-shot-list") as ShotList;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the empty-state hint when shots is empty", async () => {
    element.shots = [];
    await element.updateComplete;

    const emptyState = element.shadowRoot?.querySelector("brew-empty-state");
    expect(emptyState).not.toBeNull();
    expect(emptyState?.getAttribute("message")).toContain("No shots recorded yet");
    expect(element.shadowRoot?.querySelector(".shot-card")).toBeNull();
  });

  it("renders a shot's formatted MM:SS elapsed time", async () => {
    element.shots = [shot({ elapsedSeconds: 95 })];
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".shot-elapsed")?.textContent?.trim()).toBe("01:35");
  });

  it("renders a chart for a shot with >= 2 combined telemetry samples", async () => {
    element.shots = [
      shot({
        scaleSamples: [
          {
            timestampMs: 0,
            reading: { timeMs: 0, weightGrams: 5, flowRateGramsPerSecond: 1, batteryPercent: 90 },
          },
          {
            timestampMs: 1000,
            reading: {
              timeMs: 1000,
              weightGrams: 10,
              flowRateGramsPerSecond: 1,
              batteryPercent: 90,
            },
          },
        ],
        monitorSamples: [],
      }),
    ];
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".shot-chart-svg")).not.toBeNull();
    const weightPath = element.shadowRoot?.querySelector(".shot-series-path.weight");
    expect(weightPath?.getAttribute("d")).toMatch(/^M/);
  });

  it("does not render a chart for a shot with 0-1 combined telemetry samples", async () => {
    element.shots = [
      shot({
        scaleSamples: [
          {
            timestampMs: 0,
            reading: { timeMs: 0, weightGrams: 5, flowRateGramsPerSecond: 1, batteryPercent: 90 },
          },
        ],
        monitorSamples: [],
      }),
    ];
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".shot-chart-svg")).toBeNull();
  });

  it("renders multiple shots newest-first regardless of input order", async () => {
    const older = shot({ id: 1, createdAt: 1000, elapsedSeconds: 10 });
    const newer = shot({ id: 2, createdAt: 2000, elapsedSeconds: 20 });
    element.shots = [older, newer];
    await element.updateComplete;

    const elapsedEls = Array.from(element.shadowRoot?.querySelectorAll(".shot-elapsed") ?? []);
    expect(elapsedEls.map((el) => el.textContent?.trim())).toEqual(["00:20", "00:10"]);
  });
});
