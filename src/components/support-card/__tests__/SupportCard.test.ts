import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-support-card";
import type { SupportCard } from "../SupportCard";

describe("brew-support-card", () => {
  let element: SupportCard;

  beforeEach(async () => {
    element = document.createElement("brew-support-card") as SupportCard;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the support message", () => {
    const message = element.shadowRoot?.querySelector(".support-message")?.textContent ?? "";
    expect(message).toContain("BrewMe is free to use");
  });

  it("links out to the real Buy Me a Coffee page in a new tab, safely", () => {
    const link = element.shadowRoot?.querySelector(".bmc-link");
    expect(link?.getAttribute("href")).toBe("https://www.buymeacoffee.com/quincarter7");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders the Buy Me a Coffee button image with its intrinsic size set", () => {
    const image = element.shadowRoot?.querySelector(".bmc-image");
    expect(image?.getAttribute("src")).toBe(
      "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png",
    );
    expect(image?.getAttribute("alt")).toBe("Buy me a coffee");
    expect(image?.getAttribute("width")).toBe("217");
    expect(image?.getAttribute("height")).toBe("60");
  });
});
