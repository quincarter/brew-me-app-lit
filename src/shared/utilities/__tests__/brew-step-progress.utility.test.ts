import { describe, expect, it } from "vitest";
import type { IBrewStep } from "../../interfaces/brew.interface";
import { computeTotalStepSeconds, getBrewStepProgress } from "../brew-step-progress.utility";

const v60Steps: IBrewStep[] = [
  { id: "bloom", label: "Bloom", kind: "timed", seconds: 30 },
  { id: "pour-1", label: "Pour 1", kind: "timed", seconds: 45 },
  { id: "pour-2", label: "Pour 2", kind: "timed", seconds: 45 },
  { id: "drawdown", label: "Draw down", kind: "timed", seconds: null },
];

describe("getBrewStepProgress", () => {
  it("marks every timed step upcoming before the timer starts", () => {
    const progress = getBrewStepProgress(v60Steps, 0);

    expect(progress.map((row) => row.status)).toEqual([
      "active",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("marks the step whose window contains the elapsed time as active, and earlier ones done", () => {
    const progress = getBrewStepProgress(v60Steps, 50);

    expect(progress.map((row) => row.status)).toEqual(["done", "active", "upcoming", "upcoming"]);
  });

  it("marks a zero/null-duration step active once its start is reached, with no further step to hand off to", () => {
    const progress = getBrewStepProgress(v60Steps, 200);

    expect(progress.map((row) => row.status)).toEqual(["done", "done", "done", "active"]);
  });

  it("reports each step's cumulative start offset", () => {
    const progress = getBrewStepProgress(v60Steps, 0);

    expect(progress.map((row) => row.startSeconds)).toEqual([0, 30, 75, 120]);
  });

  it("never marks a 'note' row as done/active - it doesn't participate in timing", () => {
    const steps: IBrewStep[] = [
      { id: "bloom", label: "Bloom", kind: "timed", seconds: 30 },
      { id: "filter", label: "Filter", kind: "note", value: "Paper" },
    ];

    const progress = getBrewStepProgress(steps, 15);

    expect(progress.find((row) => row.step.id === "filter")?.status).toBe("upcoming");
  });

  it("returns an empty array for an empty step list", () => {
    expect(getBrewStepProgress([], 30)).toEqual([]);
  });

  it("marks a step active exactly when elapsed time lands on its start-second boundary", () => {
    const progress = getBrewStepProgress(v60Steps, 30);

    expect(progress.map((row) => row.status)).toEqual(["done", "active", "upcoming", "upcoming"]);
  });

  it("with consecutive zero/null-duration timed steps sharing a start offset, marks only the last as active and the earlier ones done", () => {
    const steps: IBrewStep[] = [
      { id: "bloom", label: "Bloom", kind: "timed", seconds: 30 },
      { id: "remove-filter", label: "Remove filter", kind: "timed", seconds: null },
      { id: "serve", label: "Serve", kind: "timed", seconds: null },
    ];

    const progress = getBrewStepProgress(steps, 30);

    expect(progress.map((row) => row.status)).toEqual(["done", "done", "active"]);
  });
});

describe("computeTotalStepSeconds", () => {
  it("sums up the seconds of timed steps", () => {
    expect(computeTotalStepSeconds(v60Steps)).toBe(120);
  });

  it("returns null for null, empty, or note-only steps", () => {
    expect(computeTotalStepSeconds(null)).toBeNull();
    expect(computeTotalStepSeconds([])).toBeNull();
    expect(
      computeTotalStepSeconds([{ id: "filter", label: "Filter", kind: "note", value: "Paper" }]),
    ).toBeNull();
  });
});
