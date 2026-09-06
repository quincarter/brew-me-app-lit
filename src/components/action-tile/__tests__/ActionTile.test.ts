import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CALCULATE_ICON_SVG } from "../../../shared/icons/icons";
import "../brew-action-tile";
import type { ActionTile } from "../ActionTile";

describe("brew-action-tile", () => {
  let element: ActionTile;

  beforeEach(async () => {
    element = document.createElement("brew-action-tile") as ActionTile;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  describe("with href set", () => {
    it("renders an <a> with the given href", async () => {
      element.href = "/calculate";
      await element.updateComplete;

      const link = element.shadowRoot?.querySelector("a.tile");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe("/calculate");
      expect(element.shadowRoot?.querySelector("button")).toBeNull();
    });

    it("does not fire tile-click when the link is activated", async () => {
      element.href = "/calculate";
      await element.updateComplete;

      let fired = false;
      element.addEventListener("tile-click", () => {
        fired = true;
      });
      (element.shadowRoot?.querySelector("a.tile") as HTMLAnchorElement | null)?.click();

      expect(fired).toBe(false);
    });
  });

  describe("without href set", () => {
    it("renders a <button> instead of an <a>", async () => {
      element.href = "";
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector("button.tile");
      expect(button).not.toBeNull();
      expect(button?.getAttribute("type")).toBe("button");
      expect(element.shadowRoot?.querySelector("a")).toBeNull();
    });

    it("fires tile-click (bubbles and composed) when the button is clicked", async () => {
      element.href = "";
      await element.updateComplete;

      const tileClick = new Promise<CustomEvent>((resolve) => {
        element.addEventListener("tile-click", (event) => resolve(event as CustomEvent));
      });
      element.shadowRoot?.querySelector("button")?.click();

      const event = await tileClick;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe("label/icon/svg/tone rendering", () => {
    it("renders the label text", async () => {
      element.label = "Calculate";
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".label")?.textContent).toBe("Calculate");
    });

    it("includes the tone in the tile's class list", async () => {
      element.tone = "secondary";
      await element.updateComplete;

      const tile = element.shadowRoot?.querySelector(".tile");
      expect(tile?.classList.contains("secondary")).toBe(true);
      expect(tile?.classList.contains("primary")).toBe(false);
    });

    it("defaults to the primary tone", async () => {
      const tile = element.shadowRoot?.querySelector(".tile");
      expect(tile?.classList.contains("primary")).toBe(true);
    });

    it("renders a brew-icon with the given icon name", async () => {
      element.icon = "calculate";
      await element.updateComplete;

      const icon = element.shadowRoot?.querySelector("brew-icon");
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("name")).toBe("calculate");
    });

    it("renders a brew-icon from svg when no icon name is set", async () => {
      element.icon = "";
      element.svg = null;
      await element.updateComplete;
      expect(element.shadowRoot?.querySelector("brew-icon")).toBeNull();

      element.svg = CALCULATE_ICON_SVG;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("brew-icon")).not.toBeNull();
    });

    it("prefers icon over svg when both are set", async () => {
      element.icon = "calculate";
      element.svg = CALCULATE_ICON_SVG;
      await element.updateComplete;

      expect(element.shadowRoot?.querySelectorAll("brew-icon")).toHaveLength(1);
    });

    it("omits the sublabel entirely when unset", async () => {
      expect(element.shadowRoot?.querySelector(".sublabel")).toBeNull();
    });

    it("renders the sublabel text when set", async () => {
      element.sublabel = "Dropbox · Synced";
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".sublabel")?.textContent).toBe("Dropbox · Synced");
    });
  });
});
