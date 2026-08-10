import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ISavedBrew } from "../../../shared/interfaces/brew.interface";
import { savedBrewsSignal } from "../../../shared/stores/brew.store";
import "../brew-saved-brew-picker-sheet";
import type { SavedBrewPickerSheet } from "../SavedBrewPickerSheet";

const makeBrew = (overrides: Partial<ISavedBrew> = {}): ISavedBrew => ({
  id: 1,
  brewType: "V60",
  ratio: 16,
  water: 320,
  coffee: 20,
  oz: 11,
  createdAt: Date.now(),
  ...overrides,
});

describe("brew-saved-brew-picker-sheet", () => {
  let element: SavedBrewPickerSheet;

  beforeEach(async () => {
    savedBrewsSignal.value = [];
    element = document.createElement("brew-saved-brew-picker-sheet") as SavedBrewPickerSheet;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    savedBrewsSignal.value = [];
  });

  it("renders nothing when closed", () => {
    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")).toBeNull();
  });

  it("shows a 'no saved brews yet' hint when opened with nothing saved", async () => {
    element.open = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".hint")?.textContent?.trim()).toBe(
      "No saved brews yet.",
    );
    expect(element.shadowRoot?.querySelector(".list")).toBeNull();
  });

  it("renders every saved brew entry as a row once opened", async () => {
    savedBrewsSignal.value = [makeBrew({ id: 1 }), makeBrew({ id: 2, brewType: "Aeropress" })];
    element.open = true;
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(2);
  });

  it("renders a row's headline from the brew's display name and ratio", async () => {
    savedBrewsSignal.value = [makeBrew({ id: 1, brewType: "V60", ratio: 16 })];
    element.open = true;
    await element.updateComplete;

    const row = element.shadowRoot?.querySelector("brew-list-row");
    expect(row?.getAttribute("headline")).toBe("V60 · 1:16");
  });

  it("prefers the brew's custom name over its brewType in the headline", async () => {
    savedBrewsSignal.value = [
      makeBrew({ id: 1, brewType: "V60", ratio: 16, name: "Sunday morning pour" }),
    ];
    element.open = true;
    await element.updateComplete;

    const row = element.shadowRoot?.querySelector("brew-list-row");
    expect(row?.getAttribute("headline")).toBe("Sunday morning pour · 1:16");
  });

  it("orders rows newest-activity-first, preferring lastBrewedAt over createdAt", async () => {
    savedBrewsSignal.value = [
      makeBrew({ id: 1, brewType: "Oldest, never re-brewed", createdAt: 1000 }),
      makeBrew({
        id: 2,
        brewType: "Older save, but re-brewed most recently",
        createdAt: 2000,
        lastBrewedAt: 5000,
      }),
      makeBrew({ id: 3, brewType: "Newest save", createdAt: 4000 }),
    ];
    element.open = true;
    await element.updateComplete;

    const headlines = Array.from(element.shadowRoot?.querySelectorAll("brew-list-row") ?? []).map(
      (row) => row.getAttribute("headline"),
    );
    expect(headlines).toEqual([
      "Older save, but re-brewed most recently · 1:16",
      "Newest save · 1:16",
      "Oldest, never re-brewed · 1:16",
    ]);
  });

  it("passes the open attribute through to the underlying brew-bottom-sheet", async () => {
    element.open = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-bottom-sheet")?.hasAttribute("open")).toBe(true);
  });

  it("fires saved-brew-select with the tapped brew and suppresses the row's own navigation", async () => {
    const targetBrew = makeBrew({ id: 7, brewType: "Aeropress" });
    savedBrewsSignal.value = [targetBrew];
    element.open = true;
    await element.updateComplete;

    const row = element.shadowRoot?.querySelector("brew-list-row");
    const anchor = row?.shadowRoot?.querySelector("a.row");
    if (!anchor) throw new Error("expected the row's inner anchor");

    const selectEvent = new Promise<CustomEvent<ISavedBrew>>((resolve) => {
      element.addEventListener("saved-brew-select", (event) =>
        resolve(event as CustomEvent<ISavedBrew>),
      );
    });

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true, composed: true });
    anchor.dispatchEvent(clickEvent);

    const event = await selectEvent;
    expect(event.detail).toEqual(targetBrew);
    expect(clickEvent.defaultPrevented).toBe(true);
  });
});
