import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../brew-bottom-sheet";
import type { BottomSheet } from "../BottomSheet";

describe("brew-bottom-sheet", () => {
  let element: BottomSheet;

  beforeEach(async () => {
    element = document.createElement("brew-bottom-sheet") as BottomSheet;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders nothing when open is false", () => {
    expect(element.open).toBe(false);
    expect(element.shadowRoot?.querySelector(".scrim")).toBeNull();
    expect(element.shadowRoot?.querySelector(".sheet")).toBeNull();
  });

  it("renders the scrim and a dialog sheet with the given aria-label when open", async () => {
    element.open = true;
    element.label = "Name this brew";
    await element.updateComplete;

    const scrim = element.shadowRoot?.querySelector(".scrim");
    const sheet = element.shadowRoot?.querySelector(".sheet");
    expect(scrim).not.toBeNull();
    expect(sheet).not.toBeNull();
    expect(sheet?.getAttribute("role")).toBe("dialog");
    expect(sheet?.getAttribute("aria-modal")).toBe("true");
    expect(sheet?.getAttribute("aria-label")).toBe("Name this brew");
  });

  it("renders slotted content inside the sheet", async () => {
    const child = document.createElement("span");
    child.textContent = "Sheet content";
    element.appendChild(child);
    element.open = true;
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector(".sheet");
    const slot = sheet?.querySelector("slot");
    expect(slot).not.toBeNull();
    expect(slot?.assignedElements()).toContain(child);
  });

  it("dispatches sheet-scrim-click when the scrim is clicked", async () => {
    element.open = true;
    await element.updateComplete;

    const dispatchSpy = vi.fn();
    element.addEventListener("sheet-scrim-click", dispatchSpy);

    const scrim = element.shadowRoot?.querySelector(".scrim") as HTMLElement;
    scrim.click();

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch sheet-scrim-click when the sheet itself is clicked (propagation is stopped)", async () => {
    element.open = true;
    await element.updateComplete;

    const dispatchSpy = vi.fn();
    element.addEventListener("sheet-scrim-click", dispatchSpy);

    const sheet = element.shadowRoot?.querySelector(".sheet") as HTMLElement;
    sheet.click();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
