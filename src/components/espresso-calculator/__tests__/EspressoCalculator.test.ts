import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-espresso-calculator";
import type { EspressoCalculator } from "../EspressoCalculator";
import type { TextField } from "../../text-field/TextField";

describe("brew-espresso-calculator", () => {
  let element: EspressoCalculator;

  beforeEach(async () => {
    element = document.createElement("brew-espresso-calculator") as EspressoCalculator;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const textFields = (): TextField[] =>
    Array.from(element.shadowRoot?.querySelectorAll("brew-text-field") ?? []) as TextField[];

  it("defaults to an 18g in / 1:2 / 36g out double shot", () => {
    expect(element.doseIn).toBe(18);
    expect(element.ratio).toBe(2);
    expect(element.doseOut).toBe(36);
  });

  it("renders three text fields reflecting doseIn/ratio/doseOut, labeled for dose-in/ratio/dose-out", async () => {
    element.doseIn = 20;
    element.ratio = 2.5;
    element.doseOut = 50;
    await element.updateComplete;

    const fields = textFields();
    expect(fields).toHaveLength(3);
    expect(fields[0].getAttribute("label")).toBe("Dose in (g)");
    expect(fields[0].value).toBe("20");
    expect(fields[1].getAttribute("label")).toBe("Coffee : Water ratio");
    expect(fields[1].value).toBe("2.5");
    expect(fields[2].getAttribute("label")).toBe("Dose out / shot yield (g)");
    expect(fields[2].value).toBe("50");
  });

  it("renders a '1:' prefix on the ratio field only", () => {
    const fields = textFields();
    expect(fields[0].getAttribute("prefix-text")).toBeNull();
    expect(fields[1].getAttribute("prefix-text")).toBe("1:");
    expect(fields[2].getAttribute("prefix-text")).toBeNull();
  });

  it("fires dose-in-change with the raw string value from the dose-in field", async () => {
    const fields = textFields();
    const eventPromise = new Promise<CustomEvent<string>>((resolve) => {
      element.addEventListener("dose-in-change", (event) => resolve(event as CustomEvent<string>));
    });

    fields[0].dispatchEvent(new CustomEvent<string>("value-change", { detail: "22" }));

    const event = await eventPromise;
    expect(event.detail).toBe("22");
  });

  it("fires ratio-change with the raw string value from the ratio field", async () => {
    const fields = textFields();
    const eventPromise = new Promise<CustomEvent<string>>((resolve) => {
      element.addEventListener("ratio-change", (event) => resolve(event as CustomEvent<string>));
    });

    fields[1].dispatchEvent(new CustomEvent<string>("value-change", { detail: "3" }));

    const event = await eventPromise;
    expect(event.detail).toBe("3");
  });

  it("fires dose-out-change with the raw string value from the dose-out field", async () => {
    const fields = textFields();
    const eventPromise = new Promise<CustomEvent<string>>((resolve) => {
      element.addEventListener("dose-out-change", (event) => resolve(event as CustomEvent<string>));
    });

    fields[2].dispatchEvent(new CustomEvent<string>("value-change", { detail: "44" }));

    const event = await eventPromise;
    expect(event.detail).toBe("44");
  });

  it("renders a static 'Dial it in' troubleshooting card", () => {
    expect(element.shadowRoot?.querySelector(".dial-in-title")?.textContent).toBe("Dial it in");
    expect(element.shadowRoot?.querySelectorAll(".dial-in-list li").length).toBeGreaterThan(0);
  });

  it("renders a link card to the Espresso Recipes screen", () => {
    const link = element.shadowRoot?.querySelector("brew-link-card");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/more/espresso-recipes");
  });
});
