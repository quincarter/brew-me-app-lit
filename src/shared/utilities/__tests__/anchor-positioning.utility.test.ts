import { describe, expect, it } from "vitest";
import { supportsCssAnchorPositioning } from "../anchor-positioning.utility";

describe("supportsCssAnchorPositioning", () => {
  it("returns false when the environment's style declaration has no anchorName property", () => {
    // Stubbed explicitly rather than relying on the ambient test
    // environment lacking `anchorName` - happy-dom has added real CSS
    // Anchor Positioning properties to `CSSStyleDeclaration` in newer
    // versions, so that's no longer a safe assumption to lean on here.
    const original = document.documentElement.style;
    const stub = { ...original } as Record<string, unknown>;
    delete stub.anchorName;
    Object.defineProperty(document.documentElement, "style", {
      value: stub,
      configurable: true,
    });

    expect(supportsCssAnchorPositioning()).toBe(false);

    Object.defineProperty(document.documentElement, "style", {
      value: original,
      configurable: true,
    });
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
