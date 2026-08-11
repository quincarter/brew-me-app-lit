import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IBrewStep } from "../../../shared/interfaces/brew.interface";
import type { IPrimedRecipe } from "../../../shared/interfaces/timer.interface";
import "../brew-timer-recipe-panel";
import type { TimerRecipePanel } from "../TimerRecipePanel";

const steps: IBrewStep[] = [{ id: "s1", label: "Bloom", kind: "timed", seconds: 30 }];

const primedRecipe = (overrides: Partial<IPrimedRecipe> = {}): IPrimedRecipe => ({
  name: "V60",
  brewType: "V60",
  coffee: 20,
  water: 320,
  ratio: 16,
  targetSeconds: 210,
  steps: null,
  ...overrides,
});

describe("brew-timer-recipe-panel", () => {
  let element: TimerRecipePanel;

  beforeEach(async () => {
    element = document.createElement("brew-timer-recipe-panel") as TimerRecipePanel;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders nothing when recipe is null", () => {
    expect(element.shadowRoot?.querySelector(".recipe-caption")).toBeNull();
  });

  it("renders the recipe's name, ratio, and amounts", async () => {
    element.recipe = primedRecipe();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".recipe-caption-name")?.textContent?.trim()).toBe(
      "V60 · 1:16",
    );
    expect(element.shadowRoot?.querySelector(".recipe-caption-detail")?.textContent?.trim()).toBe(
      "20g coffee · 320g water",
    );
  });

  it("marks the chip matching the current mode as selected", async () => {
    element.recipe = primedRecipe();
    element.mode = "countup";
    await element.updateComplete;

    const chips = Array.from(element.shadowRoot?.querySelectorAll("brew-chip") ?? []);
    const countUpChip = chips.find((chip) => chip.getAttribute("label") === "Count up");
    const countDownChip = chips.find((chip) => chip.getAttribute("label") === "Count down");
    expect(countUpChip?.hasAttribute("selected")).toBe(true);
    expect(countDownChip?.hasAttribute("selected")).toBe(false);
  });

  it("fires mode-change with the tapped mode", async () => {
    element.recipe = primedRecipe();
    element.mode = "countdown";
    await element.updateComplete;

    const modeChange = new Promise<CustomEvent<string>>((resolve) => {
      element.addEventListener("mode-change", (e) => resolve(e as CustomEvent<string>));
    });

    const chips = Array.from(element.shadowRoot?.querySelectorAll("brew-chip") ?? []);
    const countUpChip = chips.find((chip) => chip.getAttribute("label") === "Count up");
    countUpChip?.dispatchEvent(new CustomEvent("chip-click", { bubbles: true, composed: true }));

    expect((await modeChange).detail).toBe("countup");
  });

  it("shows the target-minutes field while counting down, seeded from the recipe's target seconds", async () => {
    element.recipe = primedRecipe({ targetSeconds: 210 });
    element.mode = "countdown";
    await element.updateComplete;

    const field = element.shadowRoot?.querySelector("brew-text-field") as
      | (HTMLElement & { value: string })
      | undefined;
    expect(field).not.toBeUndefined();
    expect(field?.value).toBe("3.5");
  });

  it("hides the target-minutes field while counting up", async () => {
    element.recipe = primedRecipe();
    element.mode = "countup";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-text-field")).toBeNull();
  });

  it("fires target-change with the raw field value on input", async () => {
    element.recipe = primedRecipe();
    element.mode = "countdown";
    await element.updateComplete;

    const targetChange = new Promise<CustomEvent<string>>((resolve) => {
      element.addEventListener("target-change", (e) => resolve(e as CustomEvent<string>));
    });

    const field = element.shadowRoot?.querySelector("brew-text-field");
    field?.dispatchEvent(
      new CustomEvent<string>("value-change", { detail: "5", bubbles: true, composed: true }),
    );

    expect((await targetChange).detail).toBe("5");
  });

  it("does not render a brew-steps-card when the recipe has no steps", async () => {
    element.recipe = primedRecipe({ steps: null });
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-steps-card")).toBeNull();
  });

  it("renders a brew-steps-card wired to elapsedSeconds when the recipe has steps", async () => {
    element.recipe = primedRecipe({ steps });
    element.elapsedSeconds = 12;
    await element.updateComplete;

    const stepsCard = element.shadowRoot?.querySelector("brew-steps-card") as
      | (HTMLElement & { elapsedSeconds: number | null })
      | undefined;
    expect(stepsCard).not.toBeUndefined();
    expect(stepsCard?.elapsedSeconds).toBe(12);
  });
});
