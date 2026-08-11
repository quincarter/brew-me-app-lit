import { html, render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../brew-text-field";
import type { TextField } from "../TextField";

describe("brew-text-field", () => {
  let element: TextField;

  beforeEach(async () => {
    element = document.createElement("brew-text-field") as TextField;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("does not render a prefix or suffix span by default", () => {
    expect(element.shadowRoot?.querySelector(".prefix")).toBeNull();
    expect(element.shadowRoot?.querySelector(".suffix")).toBeNull();
  });

  it("renders a prefix span with prefixText content when set", async () => {
    element.prefixText = "$";
    await element.updateComplete;

    const prefix = element.shadowRoot?.querySelector(".prefix");
    expect(prefix).not.toBeNull();
    expect(prefix?.textContent).toBe("$");
  });

  it("renders a suffix span with suffixText content when set", async () => {
    element.suffixText = "g";
    await element.updateComplete;

    const suffix = element.shadowRoot?.querySelector(".suffix");
    expect(suffix).not.toBeNull();
    expect(suffix?.textContent).toBe("g");
  });

  it("renders both a prefix and suffix simultaneously when both are set", async () => {
    element.prefixText = "1:";
    element.suffixText = "g";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".prefix")?.textContent).toBe("1:");
    expect(element.shadowRoot?.querySelector(".suffix")?.textContent).toBe("g");
  });

  it("reflects a non-empty value onto the input on the element's very first render (e.g. a `.value=` template binding, as `brew-ratio-form` uses)", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Mirrors how a consumer actually populates this field - via a Lit
    // `.value=` binding evaluated before the element has ever updated -
    // rather than assigning the property after `beforeEach`'s element has
    // already gone through its first (empty-value) render.
    render(html`<brew-text-field type="number" .value="${"5.66"}"></brew-text-field>`, container);

    const freshElement = container.querySelector("brew-text-field") as TextField;
    await freshElement.updateComplete;

    const input = freshElement.shadowRoot?.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("5.66");

    container.remove();
  });

  it("reflects a later value change onto the input", async () => {
    element.value = "5.66";
    await element.updateComplete;

    const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("5.66");
  });

  it("renders a min attribute on the input when set", async () => {
    element.min = "0";
    await element.updateComplete;

    const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;
    expect(input.getAttribute("min")).toBe("0");
  });

  it("does not render a min attribute by default", () => {
    const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;
    expect(input.hasAttribute("min")).toBe(false);
  });

  describe("cursor-preserving value sync (gh-12)", () => {
    it("does not reassign the input's value when a re-render echoes back what's already there", async () => {
      element.type = "number";
      element.value = "5.66";
      await element.updateComplete;

      const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;

      // The browser applies the backspace and fires `input` before any of
      // our code runs - only *after* that has this component's own `value`
      // property caught up (via `_onInput`) does the parent signal store
      // hand the same string straight back down, which is what's spied on.
      input.value = "5.6";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      const setValueSpy = vi.spyOn(input, "value", "set");
      element.value = "5.6";
      await element.updateComplete;

      expect(setValueSpy).not.toHaveBeenCalled();
      expect(input.value).toBe("5.6");
    });

    it("reassigns the input's value when set to a genuinely different value externally", async () => {
      element.type = "text";
      element.value = "5.66";
      await element.updateComplete;

      element.value = "16";
      await element.updateComplete;

      const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("16");
    });

    it("never calls setSelectionRange on a type=number input, since selection isn't supported there", async () => {
      element.type = "number";
      element.value = "5";
      await element.updateComplete;

      const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;
      const setSelectionRangeSpy = vi.spyOn(input, "setSelectionRange");

      element.value = "16";
      await element.updateComplete;

      expect(setSelectionRangeSpy).not.toHaveBeenCalled();
      expect(input.value).toBe("16");
    });
  });
});
