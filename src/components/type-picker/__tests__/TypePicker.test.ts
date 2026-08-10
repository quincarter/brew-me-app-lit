import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-type-picker";
import type { TypePicker } from "../TypePicker";

describe("brew-type-picker", () => {
  let element: TypePicker;

  beforeEach(async () => {
    element = document.createElement("brew-type-picker") as TypePicker;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const chips = (): Element[] =>
    Array.from(element.shadowRoot?.querySelectorAll("brew-chip") ?? []);

  it("renders one chip per type plus a trailing '+ Add brew type' chip", async () => {
    element.types = ["V60", "Chemex", "Aeropress"];
    await element.updateComplete;

    const labels = chips().map((chip) => chip.getAttribute("label"));
    expect(labels).toEqual(["V60", "Chemex", "Aeropress", "+ Add brew type"]);
  });

  it("marks the selected type's chip", async () => {
    element.types = ["V60", "Chemex"];
    element.selected = "Chemex";
    await element.updateComplete;

    const chemexChip = chips().find((chip) => chip.getAttribute("label") === "Chemex");
    const v60Chip = chips().find((chip) => chip.getAttribute("label") === "V60");
    expect(chemexChip?.hasAttribute("selected")).toBe(true);
    expect(v60Chip?.hasAttribute("selected")).toBe(false);
  });

  it("fires type-select with the tapped type's name", async () => {
    element.types = ["V60", "Chemex"];
    await element.updateComplete;

    const v60Chip = chips().find((chip) => chip.getAttribute("label") === "V60");
    if (!v60Chip) throw new Error("expected a V60 chip");

    const selectEvent = new Promise<CustomEvent<string>>((resolve) => {
      element.addEventListener("type-select", (event) => resolve(event as CustomEvent<string>));
    });

    v60Chip.dispatchEvent(new CustomEvent("chip-click", { bubbles: true, composed: true }));

    const event = await selectEvent;
    expect(event.detail).toBe("V60");
  });

  describe("data-tour", () => {
    it("stamps data-tour='type-v60' only on the chip labeled exactly 'V60'", async () => {
      element.types = ["V60", "Chemex", "Aeropress"];
      await element.updateComplete;

      const v60Chip = chips().find((chip) => chip.getAttribute("label") === "V60");
      const chemexChip = chips().find((chip) => chip.getAttribute("label") === "Chemex");
      const aeropressChip = chips().find((chip) => chip.getAttribute("label") === "Aeropress");
      const addChip = chips().find((chip) => chip.getAttribute("label") === "+ Add brew type");

      expect(v60Chip?.getAttribute("data-tour")).toBe("type-v60");
      expect(chemexChip?.hasAttribute("data-tour")).toBe(false);
      expect(aeropressChip?.hasAttribute("data-tour")).toBe(false);
      expect(addChip?.hasAttribute("data-tour")).toBe(false);
    });

    it("stamps no chip with data-tour when 'V60' isn't in the types list", async () => {
      element.types = ["Chemex", "Aeropress", "French Press"];
      await element.updateComplete;

      for (const chip of chips()) {
        expect(chip.hasAttribute("data-tour")).toBe(false);
      }
    });
  });
});
