import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOUR_STEPS } from "../../../shared/data/tour-steps.data";
import { tourActiveSignal, tourStepIndexSignal } from "../../../shared/stores/tour.store";
import { awaitTourTarget } from "../../../shared/utilities/tour-target.utility";
import "../brew-tour-overlay";
import type { TourOverlay } from "../TourOverlay";

vi.mock("../../../shared/utilities/tour-target.utility", () => ({
  awaitTourTarget: vi.fn(),
}));

const homeWelcomeIndex = TOUR_STEPS.findIndex((step) => step.id === "home-welcome");
const morePageIndex = TOUR_STEPS.findIndex((step) => step.id === "more-page");
const calculatorQuickIndex = TOUR_STEPS.findIndex((step) => step.id === "calculator-quick");

describe("brew-tour-overlay", () => {
  let element: TourOverlay;

  beforeEach(() => {
    vi.mocked(awaitTourTarget).mockReset();
    tourActiveSignal.value = false;
    tourStepIndexSignal.value = 0;
  });

  afterEach(() => {
    element?.remove();
    tourActiveSignal.value = false;
    tourStepIndexSignal.value = 0;
    vi.clearAllMocks();
  });

  /** Renders the component fresh so its first update already reflects the
   * step set just before calling this - avoids relying on the SignalWatcher
   * mixin re-rendering an already-connected element. */
  const mount = async (): Promise<void> => {
    element = document.createElement("brew-tour-overlay") as TourOverlay;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  /** Waits for the mocked `awaitTourTarget` call made during activation to
   * settle, then for the follow-up render it triggers. */
  const flushSpotlightActivation = async (): Promise<void> => {
    const results = vi.mocked(awaitTourTarget).mock.results;
    const lastResult = results[results.length - 1];
    if (lastResult) await lastResult.value;
    await element.updateComplete;
  };

  it("renders nothing when the tour isn't active", async () => {
    tourActiveSignal.value = false;
    await mount();

    expect(element.shadowRoot?.querySelector(".scrim")).toBeNull();
  });

  it("renders the slide card with the step's title and body", async () => {
    tourActiveSignal.value = true;
    tourStepIndexSignal.value = homeWelcomeIndex;
    await mount();

    const step = TOUR_STEPS[homeWelcomeIndex];
    expect(element.shadowRoot?.querySelector(".scrim.bottom-anchored")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".title")?.textContent).toBe(step.title);
    expect(element.shadowRoot?.querySelector(".body")?.textContent).toBe(step.body);
  });

  it("hides the Back button on the first step", async () => {
    tourActiveSignal.value = true;
    tourStepIndexSignal.value = homeWelcomeIndex;
    await mount();

    const buttons = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []);
    const backButton = buttons.find((button) => button.textContent?.trim() === "Back");
    expect(backButton).toBeUndefined();
  });

  it("shows the Back button on a non-first step", async () => {
    tourActiveSignal.value = true;
    tourStepIndexSignal.value = morePageIndex;
    await mount();

    const buttons = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []);
    const backButton = buttons.find((button) => button.textContent?.trim() === "Back");
    expect(backButton).not.toBeUndefined();
  });

  it("renders one progress dot per tour step, with .active on the current index", async () => {
    tourActiveSignal.value = true;
    tourStepIndexSignal.value = morePageIndex;
    await mount();

    const dots = Array.from(element.shadowRoot?.querySelectorAll(".progress .dot") ?? []);
    expect(dots).toHaveLength(TOUR_STEPS.length);
    expect(dots[morePageIndex].classList.contains("active")).toBe(true);
    expect(dots[homeWelcomeIndex].classList.contains("active")).toBe(false);
  });

  it("ends the tour when the close icon-button is clicked", async () => {
    tourActiveSignal.value = true;
    tourStepIndexSignal.value = homeWelcomeIndex;
    await mount();

    const closeButton = element.shadowRoot?.querySelector(".close");
    const innerButton = closeButton?.shadowRoot?.querySelector("button");
    if (!innerButton) throw new Error("expected the close icon-button's inner button");

    innerButton.click();

    expect(tourActiveSignal.value).toBe(false);
  });

  it("renders a spotlight cutout positioned from the resolved target's rect plus padding", async () => {
    const target = document.createElement("div");
    target.getBoundingClientRect = () =>
      ({
        top: 100,
        left: 50,
        right: 170,
        bottom: 140,
        x: 50,
        y: 100,
        width: 120,
        height: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    vi.mocked(awaitTourTarget).mockResolvedValue(target);

    tourActiveSignal.value = true;
    tourStepIndexSignal.value = calculatorQuickIndex;
    await mount();
    await flushSpotlightActivation();

    const step = TOUR_STEPS[calculatorQuickIndex];
    const padding = step.spotlightPadding ?? 8;
    const cutout = element.shadowRoot?.querySelector(".cutout") as HTMLElement | null;
    expect(cutout).not.toBeNull();
    expect(cutout?.style.top).toBe(`${100 - padding}px`);
    expect(cutout?.style.left).toBe(`${50 - padding}px`);
    expect(cutout?.style.width).toBe(`${120 + padding * 2}px`);
    expect(cutout?.style.height).toBe(`${40 + padding * 2}px`);

    const card = element.shadowRoot?.querySelector(".card.spotlight-card");
    expect(card).not.toBeNull();
    expect(card?.querySelector(".title")?.textContent).toBe(step.title);
  });

  it("falls back to the centered slide card when awaitTourTarget resolves null", async () => {
    vi.mocked(awaitTourTarget).mockResolvedValue(null);

    tourActiveSignal.value = true;
    tourStepIndexSignal.value = calculatorQuickIndex;
    await mount();
    await flushSpotlightActivation();

    expect(element.shadowRoot?.querySelector(".cutout")).toBeNull();
    expect(element.shadowRoot?.querySelector(".scrim.bottom-anchored")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".card")).not.toBeNull();
  });
});
