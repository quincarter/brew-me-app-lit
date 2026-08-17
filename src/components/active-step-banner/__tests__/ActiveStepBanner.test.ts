import { afterEach, describe, expect, it } from "vitest";
import type { IBrewStep } from "../../../shared/interfaces/brew.interface";
import "../brew-active-step-banner";
import type { ActiveStepBanner } from "../ActiveStepBanner";

const noteOnlySteps: IBrewStep[] = [
  { id: "n1", label: "Grind", kind: "note", value: "Medium-fine" },
  { id: "n2", label: "Rinse", kind: "note", value: "Paper filter" },
];

const timedSteps: IBrewStep[] = [
  { id: "p1", label: "Bloom", kind: "timed", seconds: 30 },
  { id: "p2", label: "Pour", kind: "timed", seconds: 45 },
  { id: "p3", label: "Draw down", kind: "timed", seconds: null },
];

describe("brew-active-step-banner", () => {
  let element: ActiveStepBanner;

  afterEach(() => {
    element.remove();
  });

  const mount = async (steps: IBrewStep[] | null, elapsedSeconds = 0): Promise<void> => {
    element = document.createElement("brew-active-step-banner") as ActiveStepBanner;
    document.body.appendChild(element);
    element.steps = steps;
    element.elapsedSeconds = elapsedSeconds;
    await element.updateComplete;
  };

  it("renders nothing when steps is null", async () => {
    await mount(null);

    expect(element.shadowRoot?.querySelector(".banner")).toBeNull();
  });

  it("renders nothing when steps is an empty array", async () => {
    await mount([]);

    expect(element.shadowRoot?.querySelector(".banner")).toBeNull();
  });

  describe("before any timed step has become active (an all-note sequence)", () => {
    it("shows the first step's label as the current step", async () => {
      await mount(noteOnlySteps);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Grind");
    });

    it("shows the second step's label in the next row, without the next-row-empty class", async () => {
      await mount(noteOnlySteps);

      const nextRow = element.shadowRoot?.querySelector(".next-row");
      expect(nextRow?.classList.contains("next-row-empty")).toBe(false);
      expect(nextRow?.querySelector(".next-label")?.textContent?.trim()).toBe("Rinse");
    });

    it("shows the first (note) step's value in a value-badge, with no countdown", async () => {
      await mount(noteOnlySteps);

      expect(element.shadowRoot?.querySelector(".value-badge")?.textContent?.trim()).toBe(
        "Medium-fine",
      );
      expect(element.shadowRoot?.querySelector(".countdown")).toBeNull();
    });
  });

  describe("midway through a timed step", () => {
    it("shows the active step's label", async () => {
      // 40s elapsed: "Bloom" (30s) is done, 10s into "Pour" (45s).
      await mount(timedSteps, 40);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Pour");
    });

    it("shows the correctly decremented remaining time in the countdown", async () => {
      await mount(timedSteps, 40);

      // "Pour" started at 30s and runs 45s -> 35s remain at 40s elapsed.
      expect(element.shadowRoot?.querySelector(".countdown")?.textContent?.trim()).toBe("00:35");
      expect(element.shadowRoot?.querySelector(".value-badge")).toBeNull();
    });

    it("shows the following step's label in the next row", async () => {
      await mount(timedSteps, 40);

      const nextRow = element.shadowRoot?.querySelector(".next-row");
      expect(nextRow?.classList.contains("next-row-empty")).toBe(false);
      expect(nextRow?.querySelector(".next-label")?.textContent?.trim()).toBe("Draw down");
    });
  });

  describe("a timed step with no set duration once active", () => {
    it("shows a 'Now' value-badge instead of a countdown", async () => {
      // 75s elapsed = 30s ("Bloom") + 45s ("Pour") -> "Draw down" (null
      // seconds) is now active.
      await mount(timedSteps, 75);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Draw down");
      expect(element.shadowRoot?.querySelector(".value-badge")?.textContent?.trim()).toBe("Now");
      expect(element.shadowRoot?.querySelector(".countdown")).toBeNull();
    });

    it("marks the next row empty since there is no following step", async () => {
      await mount(timedSteps, 75);

      const nextRow = element.shadowRoot?.querySelector(".next-row");
      expect(nextRow).not.toBeNull();
      expect(nextRow?.classList.contains("next-row-empty")).toBe(true);
      expect(nextRow?.querySelector(".next-label")?.textContent?.trim()).toBe("");
    });
  });

  describe("elapsedSeconds updates advancing the active step", () => {
    it("moves the label forward as elapsed seconds crosses each step's start boundary", async () => {
      await mount(timedSteps, 0);
      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Bloom");

      element.elapsedSeconds = 30;
      await element.updateComplete;
      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Pour");

      element.elapsedSeconds = 75;
      await element.updateComplete;
      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Draw down");
    });
  });

  describe("once elapsed time reaches/exceeds every timed step's total duration", () => {
    it("shows an 'All steps complete' label instead of freezing on the last step", async () => {
      // Both steps here have a real positive duration (unlike `timedSteps`,
      // whose trailing "Draw down" has `seconds: null`), so there's no
      // untimed step left to fall onto - `_computeCue` checks the
      // hasTimed/totalTimedSeconds "all done" condition before consulting
      // `getBrewStepProgress` (whose own `activeIndex` would otherwise keep
      // reporting the last timed step "active" forever).
      const allPositiveDurationSteps: IBrewStep[] = [
        { id: "a1", label: "Bloom", kind: "timed", seconds: 30 },
        { id: "a2", label: "Pour", kind: "timed", seconds: 45 },
      ];
      await mount(allPositiveDurationSteps, 200);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe(
        "All steps complete",
      );
      expect(element.shadowRoot?.querySelector(".countdown")).toBeNull();
    });

    it("marks the next row empty in the all-complete state", async () => {
      const allPositiveDurationSteps: IBrewStep[] = [
        { id: "a1", label: "Bloom", kind: "timed", seconds: 30 },
        { id: "a2", label: "Pour", kind: "timed", seconds: 45 },
      ];
      await mount(allPositiveDurationSteps, 200);

      const nextRow = element.shadowRoot?.querySelector(".next-row");
      expect(nextRow).not.toBeNull();
      expect(nextRow?.classList.contains("next-row-empty")).toBe(true);
      expect(nextRow?.querySelector(".next-label")?.textContent?.trim()).toBe("");
    });

    it("still shows the active step normally right at the exact boundary minus one second", async () => {
      const allPositiveDurationSteps: IBrewStep[] = [
        { id: "a1", label: "Bloom", kind: "timed", seconds: 30 },
        { id: "a2", label: "Pour", kind: "timed", seconds: 45 },
      ];
      await mount(allPositiveDurationSteps, 74);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Pour");
      expect(element.shadowRoot?.querySelector(".countdown")?.textContent?.trim()).toBe("00:01");
    });
  });

  describe("a fixed-duration timed step followed by a trailing note step", () => {
    // Mirrors the real WAC AeroPress "2023-1" recipe's shape
    // (`src/shared/data/aeropress-recipes.data.ts`): several timed steps
    // ending in a fixed-duration "Flip & press" (30s), followed by a
    // "Bypass & serve" note with no time of its own. Total timed duration:
    // 30 + 15 + 10 + 40 + 30 = 125s.
    const stepsEndingInNote: IBrewStep[] = [
      { id: "pour", label: "Pour", kind: "timed", seconds: 30 },
      { id: "stir-1", label: "Stir & wait", kind: "timed", seconds: 15 },
      { id: "add-coffee", label: "Add coffee", kind: "timed", seconds: 10 },
      { id: "stir-2", label: "Stir & prep", kind: "timed", seconds: 40 },
      { id: "press", label: "Flip & press", kind: "timed", seconds: 30 },
      { id: "bypass", label: "Bypass & serve", kind: "note", value: "Bypass with water, serve" },
    ];

    it("keeps counting down the last timed step right up to its final second", async () => {
      await mount(stepsEndingInNote, 124);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Flip & press");
      expect(element.shadowRoot?.querySelector(".countdown")?.textContent?.trim()).toBe("00:01");
    });

    it("hands off to the trailing note step once the last timed step's countdown reaches zero", async () => {
      await mount(stepsEndingInNote, 125);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe(
        "Bypass & serve",
      );
      expect(element.shadowRoot?.querySelector(".value-badge")?.textContent?.trim()).toBe(
        "Bypass with water, serve",
      );
      expect(element.shadowRoot?.querySelector(".countdown")).toBeNull();
    });

    it("stays on the trailing note step well past the last timed step's end", async () => {
      await mount(stepsEndingInNote, 400);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe(
        "Bypass & serve",
      );
    });
  });

  describe("an open-ended (no set duration) final timed step followed by a trailing note", () => {
    // Mirrors WAC AeroPress recipes like "2024-1"/"2019-1", whose last timed
    // step ("Press") has `seconds: null` - there is no time signal for when
    // pressing finishes, so this intentionally stays "active" (a "Now"
    // value-badge) indefinitely rather than ever auto-advancing to the
    // trailing note; the note is still visible via the reserved next-row.
    const openEndedFinalStep: IBrewStep[] = [
      { id: "bloom", label: "Bloom", kind: "timed", seconds: 30 },
      { id: "press", label: "Press", kind: "timed", seconds: null },
      { id: "dilute", label: "Dilute & serve", kind: "note", value: "Dilute to 130g" },
    ];

    it("keeps the open-ended step current with a 'Now' badge, long after it started", async () => {
      await mount(openEndedFinalStep, 300);

      expect(element.shadowRoot?.querySelector(".label")?.textContent?.trim()).toBe("Press");
      expect(element.shadowRoot?.querySelector(".value-badge")?.textContent?.trim()).toBe("Now");
      expect(element.shadowRoot?.querySelector(".countdown")).toBeNull();
    });

    it("still surfaces the trailing note as the next step", async () => {
      await mount(openEndedFinalStep, 300);

      const nextRow = element.shadowRoot?.querySelector(".next-row");
      expect(nextRow?.classList.contains("next-row-empty")).toBe(false);
      expect(nextRow?.querySelector(".next-label")?.textContent?.trim()).toBe("Dilute & serve");
    });
  });
});
