import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOUR_STEPS } from "../../../shared/data/tour-steps.data";
import { tourActiveSignal, tourStepIndexSignal } from "../../../shared/stores/tour.store";
import { supportsCssAnchorPositioning } from "../../../shared/utilities/anchor-positioning.utility";
import { awaitTourTarget } from "../../../shared/utilities/tour-target.utility";
import "../brew-tour-overlay";
import type { TourOverlay } from "../TourOverlay";

vi.mock("../../../shared/utilities/tour-target.utility", () => ({
  awaitTourTarget: vi.fn(),
}));

vi.mock("../../../shared/utilities/anchor-positioning.utility", () => ({
  supportsCssAnchorPositioning: vi.fn(() => false),
}));

const homeWelcomeIndex = TOUR_STEPS.findIndex((step) => step.id === "home-welcome");
const morePageIndex = TOUR_STEPS.findIndex((step) => step.id === "more-page");
const calculatorQuickIndex = TOUR_STEPS.findIndex((step) => step.id === "calculator-quick");
const calculatorGuidedIndex = TOUR_STEPS.findIndex((step) => step.id === "calculator-guided");

/** Builds a stubbed target element with a fixed non-zero `getBoundingClientRect`. */
const createTarget = (rect: Partial<DOMRect> = {}): HTMLElement => {
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
      ...rect,
    }) as DOMRect;
  return target;
};

describe("brew-tour-overlay", () => {
  let element: TourOverlay;

  beforeEach(() => {
    vi.mocked(awaitTourTarget).mockReset();
    vi.mocked(supportsCssAnchorPositioning).mockReturnValue(false);
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
    const dialog = element.shadowRoot?.querySelector("dialog");
    expect(dialog?.open).toBe(false);
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

  it("shows the step in a native modal dialog and ends the tour on Escape (cancel)", async () => {
    tourActiveSignal.value = true;
    tourStepIndexSignal.value = homeWelcomeIndex;
    await mount();

    const dialog = element.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    const cancelEvent = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
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

  describe("CSS Anchor Positioning support", () => {
    it("renders an anchor-proxy mirroring the target's rect, plus the anchored cutout/card, without mutating the target element", async () => {
      vi.mocked(supportsCssAnchorPositioning).mockReturnValue(true);
      const target = createTarget();
      vi.mocked(awaitTourTarget).mockResolvedValue(target);

      tourActiveSignal.value = true;
      tourStepIndexSignal.value = calculatorQuickIndex;
      await mount();
      await flushSpotlightActivation();

      const proxy = element.shadowRoot?.querySelector(".anchor-proxy") as HTMLElement | null;
      expect(proxy).not.toBeNull();
      expect(proxy?.style.top).toBe("100px");
      expect(proxy?.style.left).toBe("50px");
      expect(proxy?.style.width).toBe("120px");
      expect(proxy?.style.height).toBe("40px");

      expect(element.shadowRoot?.querySelector(".cutout.anchored")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".card.spotlight-card.anchored")).not.toBeNull();

      /** CSS Anchor Positioning only resolves an anchor within the *same
       * shadow tree* as the positioned element, and the real target lives
       * in a different component's shadow root - so TourOverlay must never
       * write to the target's own style; `.anchor-proxy` above is what the
       * cutout/card actually anchor to. */
      expect(target.getAttribute("style")).toBeNull();
    });

    it("updates the anchor-proxy's rect when advancing to a new spotlight step", async () => {
      vi.mocked(supportsCssAnchorPositioning).mockReturnValue(true);
      const firstTarget = createTarget();
      const secondTarget = createTarget({ top: 300, left: 20, width: 60, height: 30 });
      vi.mocked(awaitTourTarget)
        .mockResolvedValueOnce(firstTarget)
        .mockResolvedValueOnce(secondTarget);

      tourActiveSignal.value = true;
      tourStepIndexSignal.value = calculatorQuickIndex;
      await mount();
      await flushSpotlightActivation();

      tourStepIndexSignal.value = calculatorGuidedIndex;
      await element.updateComplete;
      await flushSpotlightActivation();

      const proxy = element.shadowRoot?.querySelector(".anchor-proxy") as HTMLElement | null;
      expect(proxy?.style.top).toBe("300px");
      expect(proxy?.style.left).toBe("20px");
      expect(proxy?.style.width).toBe("60px");
      expect(proxy?.style.height).toBe("30px");
    });
  });
});
