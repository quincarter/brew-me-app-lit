import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { queryDeep } from "../shadow-query.utility";

/**
 * Three throwaway custom elements forming a shadow-DOM chain:
 * `shadow-query-outer` (light DOM) -> `shadow-query-inner` (outer's shadow
 * root) -> a plain `.leaf` div (inner's shadow root) - enough to exercise a
 * two- and three-selector path piercing one and two shadow boundaries.
 */
class ShadowQueryOuter extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(document.createElement("shadow-query-inner"));
  }
}
if (!customElements.get("shadow-query-outer")) {
  customElements.define("shadow-query-outer", ShadowQueryOuter);
}

class ShadowQueryInner extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    const leaf = document.createElement("div");
    leaf.className = "leaf";
    root.appendChild(leaf);
  }
}
if (!customElements.get("shadow-query-inner")) {
  customElements.define("shadow-query-inner", ShadowQueryInner);
}

describe("queryDeep", () => {
  let outer: ShadowQueryOuter;

  beforeEach(() => {
    outer = document.createElement("shadow-query-outer") as ShadowQueryOuter;
    document.body.appendChild(outer);
  });

  afterEach(() => {
    outer.remove();
  });

  it("finds a deeply (2-level) nested element", () => {
    const found = queryDeep(["shadow-query-outer", "shadow-query-inner"]);

    expect(found).not.toBeNull();
    expect(found?.tagName.toLowerCase()).toBe("shadow-query-inner");
    expect(found).toBe(outer.shadowRoot?.querySelector("shadow-query-inner"));
  });

  it("pierces two shadow boundaries with a 3-element path", () => {
    const found = queryDeep(["shadow-query-outer", "shadow-query-inner", ".leaf"]);

    expect(found).not.toBeNull();
    expect(found?.classList.contains("leaf")).toBe(true);
  });

  it("returns null when an intermediate selector doesn't match", () => {
    const found = queryDeep(["shadow-query-outer", "does-not-exist", ".leaf"]);

    expect(found).toBeNull();
  });

  it("returns null when the final selector doesn't match anything", () => {
    const found = queryDeep(["shadow-query-outer", "shadow-query-inner", ".not-there"]);

    expect(found).toBeNull();
  });

  it("returns null for an empty selector path array", () => {
    expect(queryDeep([])).toBeNull();
  });

  it("finds a plain light-DOM element with a single-element path, no shadow piercing needed", () => {
    const plain = document.createElement("div");
    plain.id = "plain-target";
    document.body.appendChild(plain);

    const found = queryDeep(["#plain-target"]);

    expect(found).toBe(plain);

    plain.remove();
  });
});
