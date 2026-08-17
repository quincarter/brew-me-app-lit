import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-timer-dial";
import type { TimerDial } from "../TimerDial";

describe("brew-timer-dial", () => {
  let element: TimerDial;

  beforeEach(async () => {
    element = document.createElement("brew-timer-dial") as TimerDial;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("shows a 'Ready' label above the value when idle and not counting down", async () => {
    element.idle = true;
    element.countdown = false;
    element.seconds = 0;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".dial-label")?.textContent?.trim()).toBe("Ready");
    expect(element.shadowRoot?.querySelector(".dial-value")?.textContent?.trim()).toBe("00:00");
  });

  it("shows a 'Brewing' label once no longer idle and not counting down", async () => {
    element.idle = false;
    element.countdown = false;
    element.seconds = 65;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".dial-label")?.textContent?.trim()).toBe("Brewing");
    expect(element.shadowRoot?.querySelector(".dial-value")?.textContent?.trim()).toBe("01:05");
  });

  it("shows a 'total brew time' label under the value while counting down", async () => {
    element.countdown = true;
    element.idle = false;
    element.seconds = 125;
    await element.updateComplete;

    const value = element.shadowRoot?.querySelector(".dial-value");
    const label = element.shadowRoot?.querySelector(".dial-label");
    expect(value?.textContent?.trim()).toBe("02:05");
    expect(label?.textContent?.trim()).toBe("total brew time");
    // The countdown layout renders the value before the label (unlike the plain stopwatch layout).
    expect(value?.nextElementSibling).toBe(label ?? null);
  });
});
