import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-ratio-summary";
import type { RatioSummary } from "../RatioSummary";

describe("brew-ratio-summary", () => {
  let element: RatioSummary;

  beforeEach(async () => {
    element = document.createElement("brew-ratio-summary") as RatioSummary;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the default zero values when no props are set", () => {
    expect(element.shadowRoot?.querySelector(".ratio-value")?.textContent?.trim()).toBe("1:0");
    expect(element.shadowRoot?.querySelector(".ratio-label")?.textContent?.trim()).toBe(
      "Coffee to water ratio",
    );

    const stats = element.shadowRoot?.querySelectorAll(".stat");
    expect(stats?.length).toBe(3);
    expect(stats?.[0]?.querySelector(".stat-value")?.textContent?.trim()).toBe("0g");
    expect(stats?.[0]?.querySelector(".stat-label")?.textContent?.trim()).toBe("coffee");
    expect(stats?.[1]?.querySelector(".stat-value")?.textContent?.trim()).toBe("0g");
    expect(stats?.[1]?.querySelector(".stat-label")?.textContent?.trim()).toBe("water");
    expect(stats?.[2]?.querySelector(".stat-value")?.textContent?.trim()).toBe("0oz");
    expect(stats?.[2]?.querySelector(".stat-label")?.textContent?.trim()).toBe("cup size");
  });

  it("renders the formatted ratio and every stat tile when populated", async () => {
    element.ratio = 16;
    element.coffee = 20;
    element.water = 320;
    element.oz = 11;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".ratio-value")?.textContent?.trim()).toBe("1:16");
    expect(element.shadowRoot?.querySelector(".ratio-label")?.textContent?.trim()).toBe(
      "Coffee to water ratio",
    );

    const stats = element.shadowRoot?.querySelectorAll(".stat");
    expect(stats?.[0]?.querySelector(".stat-value")?.textContent?.trim()).toBe("20g");
    expect(stats?.[0]?.querySelector(".stat-label")?.textContent?.trim()).toBe("coffee");
    expect(stats?.[1]?.querySelector(".stat-value")?.textContent?.trim()).toBe("320g");
    expect(stats?.[1]?.querySelector(".stat-label")?.textContent?.trim()).toBe("water");
    expect(stats?.[2]?.querySelector(".stat-value")?.textContent?.trim()).toBe("11oz");
    expect(stats?.[2]?.querySelector(".stat-label")?.textContent?.trim()).toBe("cup size");
  });

  it("uses formatRatio rather than rendering the raw ratio number", async () => {
    element.ratio = 16;
    await element.updateComplete;

    const ratioValue = element.shadowRoot?.querySelector(".ratio-value")?.textContent?.trim();
    expect(ratioValue).not.toBe("16");
    expect(ratioValue).toBe("1:16");
  });
});
