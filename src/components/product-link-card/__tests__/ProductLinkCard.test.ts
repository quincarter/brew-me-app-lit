import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-product-link-card";
import type { ProductLinkCard } from "../ProductLinkCard";

describe("brew-product-link-card", () => {
  let element: ProductLinkCard;

  beforeEach(async () => {
    element = document.createElement("brew-product-link-card") as ProductLinkCard;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the affiliate link card structure with default values", async () => {
    const anchor = element.shadowRoot?.querySelector<HTMLAnchorElement>(".product-link-card");

    expect(anchor).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".product-icon")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".product-text")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".product-title-row")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".product-title")?.textContent?.trim()).toBe("");
    expect(element.shadowRoot?.querySelector(".product-subtitle")?.textContent?.trim()).toBe("");
  });

  it("defaults the icon to shopping_bag", () => {
    expect(element.icon).toBe("shopping_bag");
    const icon = element.shadowRoot?.querySelector(".product-icon brew-icon");
    expect(icon?.getAttribute("name")).toBe("shopping_bag");
  });

  it("reflects href, label, description, and icon props into the DOM", async () => {
    element.href = "https://amzn.to/example";
    element.label = "Nitro Cold Brew Kegs — Royal Brew";
    element.description = "A home nitro cold brew kegging system";
    element.icon = "local_cafe";
    await element.updateComplete;

    const anchor = element.shadowRoot?.querySelector<HTMLAnchorElement>(".product-link-card");
    expect(anchor?.getAttribute("href")).toBe("https://amzn.to/example");
    expect(element.shadowRoot?.querySelector(".product-title")?.textContent?.trim()).toBe(
      "Nitro Cold Brew Kegs — Royal Brew",
    );
    expect(element.shadowRoot?.querySelector(".product-subtitle")?.textContent?.trim()).toBe(
      "A home nitro cold brew kegging system",
    );
  });

  it("always shows the Affiliate link badge, regardless of props", async () => {
    const badge = element.shadowRoot?.querySelector(".affiliate-badge");
    expect(badge?.textContent?.trim()).toBe("Affiliate link");

    element.label = "Some other product";
    element.description = "Some other description";
    await element.updateComplete;

    const badgeAfter = element.shadowRoot?.querySelector(".affiliate-badge");
    expect(badgeAfter?.textContent?.trim()).toBe("Affiliate link");
  });

  it("always opens in a new tab with rel=noopener noreferrer", () => {
    const anchor = element.shadowRoot?.querySelector<HTMLAnchorElement>(".product-link-card");
    expect(anchor?.getAttribute("target")).toBe("_blank");
    expect(anchor?.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
