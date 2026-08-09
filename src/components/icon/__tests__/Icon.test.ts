import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-icon";
import type { Icon } from "../Icon";

describe("brew-icon", () => {
  let element: Icon;

  beforeEach(async () => {
    element = document.createElement("brew-icon") as Icon;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("defaults filled to false and sets the FILL font-variation-setting to 0", () => {
    expect(element.filled).toBe(false);
    const span = element.shadowRoot?.querySelector("span");
    expect(span?.getAttribute("style")).toContain("'FILL' 0");
  });

  it("sets the FILL font-variation-setting to 1 when filled", async () => {
    element.filled = true;
    await element.updateComplete;

    const span = element.shadowRoot?.querySelector("span");
    expect(span?.getAttribute("style")).toContain("'FILL' 1");
  });

  it("still applies the font-size style alongside FILL", async () => {
    element.size = 32;
    element.filled = true;
    await element.updateComplete;

    const span = element.shadowRoot?.querySelector("span");
    expect(span?.getAttribute("style")).toContain("font-size:32px");
  });
});
