import { describe, expect, it } from "vitest";
import { supportsCssAnchorPositioning } from "../anchor-positioning.utility";

describe("supportsCssAnchorPositioning", () => {
  it("returns false when the environment's style declaration has no anchorName property", () => {
    // happy-dom's `CSSStyleDeclaration` doesn't implement `anchorName` -
    // this is the real baseline for this repo's test environment.
    expect(supportsCssAnchorPositioning()).toBe(false);
  });

  it("returns true when anchorName is present on documentElement.style", () => {
    const original = document.documentElement.style;
    Object.defineProperty(document.documentElement, "style", {
      value: { ...original, anchorName: "" },
      configurable: true,
    });

    expect(supportsCssAnchorPositioning()).toBe(true);

    Object.defineProperty(document.documentElement, "style", {
      value: original,
      configurable: true,
    });
  });

  it("returns false instead of throwing when document is unavailable", () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error - deliberately simulating a non-browser environment.
    delete globalThis.document;

    expect(supportsCssAnchorPositioning()).toBe(false);

    globalThis.document = originalDocument;
  });
});
