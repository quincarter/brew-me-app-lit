import { describe, expect, it } from "vitest";
import { buildExtractionChartPath, type IChartDomain } from "../extraction-chart-path.utility";

describe("extraction-chart-path.utility", () => {
  const domain: IChartDomain = {
    minElapsedSeconds: 0,
    maxElapsedSeconds: 10,
    minValue: 0,
    maxValue: 10,
  };

  it("returns an empty string for no points", () => {
    expect(buildExtractionChartPath([], domain, 100, 100)).toBe("");
  });

  it("returns an empty string for a single point", () => {
    expect(buildExtractionChartPath([{ elapsedSeconds: 0, value: 0 }], domain, 100, 100)).toBe("");
  });

  it("builds a straight-line path for a simple two-point series", () => {
    const points = [
      { elapsedSeconds: 0, value: 0 },
      { elapsedSeconds: 10, value: 10 },
    ];

    // (0,0) -> top-left of chart-space maps to bottom-left of the viewBox (y is flipped, larger value = higher up)
    // (10,10) -> bottom-right of chart-space maps to top-right of the viewBox
    expect(buildExtractionChartPath(points, domain, 100, 100)).toBe("M0,100 L100,0");
  });

  it("builds a straight-line path for a three-point series", () => {
    const points = [
      { elapsedSeconds: 0, value: 0 },
      { elapsedSeconds: 5, value: 5 },
      { elapsedSeconds: 10, value: 0 },
    ];

    expect(buildExtractionChartPath(points, domain, 100, 100)).toBe("M0,100 L50,50 L100,100");
  });

  it("clamps x to the viewBox center when the elapsed-seconds domain has zero range", () => {
    const zeroElapsedDomain: IChartDomain = {
      minElapsedSeconds: 5,
      maxElapsedSeconds: 5,
      minValue: 0,
      maxValue: 10,
    };
    const points = [
      { elapsedSeconds: 5, value: 0 },
      { elapsedSeconds: 5, value: 10 },
    ];

    expect(buildExtractionChartPath(points, zeroElapsedDomain, 100, 100)).toBe("M50,100 L50,0");
  });

  it("clamps y to the viewBox center when the value domain has zero range", () => {
    const zeroValueDomain: IChartDomain = {
      minElapsedSeconds: 0,
      maxElapsedSeconds: 10,
      minValue: 5,
      maxValue: 5,
    };
    const points = [
      { elapsedSeconds: 0, value: 5 },
      { elapsedSeconds: 10, value: 5 },
    ];

    expect(buildExtractionChartPath(points, zeroValueDomain, 100, 100)).toBe("M0,50 L100,50");
  });
});
