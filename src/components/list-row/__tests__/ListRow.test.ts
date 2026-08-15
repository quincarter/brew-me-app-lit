import { svg } from "lit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-list-row";
import type { ListRow } from "../ListRow";
import type { Icon } from "../../icon/Icon";
import type { Avatar } from "../../avatar/Avatar";

describe("brew-list-row", () => {
  let element: ListRow;

  beforeEach(async () => {
    element = document.createElement("brew-list-row") as ListRow;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("does not render brew-star-rating when isSavedBrew is false (non-brew list rows, e.g. tools/guide lists)", () => {
    expect(element.shadowRoot?.querySelector("brew-star-rating")).toBeNull();
  });

  it("renders a compact brew-star-rating even when rating is 0, for row-height alignment", async () => {
    element.isSavedBrew = true;
    await element.updateComplete;

    const starRating = element.shadowRoot?.querySelector("brew-star-rating");
    expect(starRating).not.toBeNull();
    expect(starRating?.getAttribute("value")).toBe("0");
    expect(starRating?.getAttribute("size")).toBe("14");
  });

  it("renders a compact brew-star-rating when rating is set", async () => {
    element.isSavedBrew = true;
    element.rating = 4;
    await element.updateComplete;

    const starRating = element.shadowRoot?.querySelector("brew-star-rating");
    expect(starRating).not.toBeNull();
    expect(starRating?.getAttribute("value")).toBe("4");
    expect(starRating?.getAttribute("size")).toBe("14");
  });

  it("renders a Material Symbols icon by name when leadingIcon is a string", async () => {
    element.leadingIcon = "timer";
    await element.updateComplete;

    const icon = element.shadowRoot?.querySelector(".icon-circle brew-icon");
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("name")).toBe("timer");
  });

  it("renders a custom SVG icon when leadingIcon is an SVGTemplateResult", async () => {
    const testIconSvg = svg`<svg><circle /></svg>`;
    element.leadingIcon = testIconSvg;
    await element.updateComplete;

    const icon = element.shadowRoot?.querySelector(".icon-circle brew-icon") as Icon | null;
    expect(icon).not.toBeNull();
    if (icon) {
      customElements.upgrade(icon);
      await icon.updateComplete;
    }
    expect(icon?.svg).toBe(testIconSvg);
    expect(icon?.hasAttribute("name")).toBe(false);
  });

  it("renders a brew-avatar (not an icon-circle) when leadingInitial is set", async () => {
    element.leadingInitial = "V";
    element.leadingBg = "red";
    element.leadingFg = "white";
    await element.updateComplete;

    const avatar = element.shadowRoot?.querySelector("brew-avatar");
    expect(avatar).not.toBeNull();
    expect(avatar?.getAttribute("initial")).toBe("V");
    expect(avatar?.getAttribute("background")).toBe("red");
    expect(avatar?.getAttribute("foreground")).toBe("white");
    expect(avatar?.getAttribute("size")).toBe("44");
    expect(element.shadowRoot?.querySelector(".icon-circle")).toBeNull();
  });

  it("passes avatarIcon through to the brew-avatar's icon property", async () => {
    const testIconSvg = svg`<svg><circle /></svg>`;
    element.leadingInitial = "V";
    element.avatarIcon = testIconSvg;
    await element.updateComplete;

    const avatar = element.shadowRoot?.querySelector("brew-avatar") as Avatar | null;
    expect(avatar).not.toBeNull();
    if (avatar) {
      customElements.upgrade(avatar);
      await avatar.updateComplete;
    }
    expect(avatar?.icon).toBe(testIconSvg);
  });

  it("prioritizes leadingInitial over leadingIcon when both are set", async () => {
    element.leadingInitial = "V";
    element.leadingIcon = "timer";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-avatar")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".icon-circle")).toBeNull();
  });

  it("renders neither an avatar nor an icon-circle when no leading prop is set", () => {
    expect(element.shadowRoot?.querySelector("brew-avatar")).toBeNull();
    expect(element.shadowRoot?.querySelector(".icon-circle")).toBeNull();
  });

  it("does not render a replay button when replayable is false", () => {
    expect(element.shadowRoot?.querySelector("brew-icon-button")).toBeNull();
  });

  it("renders a replay button when replayable is true", async () => {
    element.replayable = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-icon-button")).not.toBeNull();
  });

  it("dispatches replay-click without triggering the row's own navigation on replay click", async () => {
    element.href = "/saved/1";
    element.replayable = true;
    await element.updateComplete;

    const replayButton = element.shadowRoot?.querySelector("brew-icon-button");
    const anchor = element.shadowRoot?.querySelector("a.row");
    expect(replayButton).not.toBeNull();

    let replayClickFired = false;
    element.addEventListener("replay-click", () => {
      replayClickFired = true;
    });
    let anchorClickReceived = false;
    anchor?.addEventListener("click", () => {
      anchorClickReceived = true;
    });

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    replayButton?.dispatchEvent(clickEvent);

    expect(replayClickFired).toBe(true);
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(anchorClickReceived).toBe(false);
  });
});
