import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
});
