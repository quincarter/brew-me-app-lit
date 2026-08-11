import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addSavedBrew, deleteAllSavedBrews, markBrewedNow } from "../../../shared/stores/brew.store";
import "../saved-page";
import type { SavedPage } from "../saved-page";

describe("saved-page", () => {
  let element: SavedPage;

  beforeEach(async () => {
    deleteAllSavedBrews();
    element = document.createElement("saved-page") as SavedPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    deleteAllSavedBrews();
  });

  it("renders empty state when no brews are saved", () => {
    const emptyState = element.shadowRoot?.querySelector("brew-empty-state");
    expect(emptyState).not.toBeNull();
  });

  it("renders saved brews sorted with the most recent at the top", async () => {
    const brew1 = addSavedBrew({
      brewType: "V60",
      ratio: 16,
      water: 320,
      coffee: 20,
      oz: 11.28,
    });

    const brew2 = addSavedBrew({
      brewType: "Chemex",
      ratio: 16,
      water: 480,
      coffee: 30,
      oz: 16.93,
    });

    await element.updateComplete;

    let rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    expect(rows).toHaveLength(2);
    // brew2 saved second (newer createdAt), should be first
    expect(rows?.[0].getAttribute("href")).toBe(`/saved/${brew2.id}`);
    expect(rows?.[1].getAttribute("href")).toBe(`/saved/${brew1.id}`);

    // Mark older brew (brew1) as brewed now
    markBrewedNow(brew1.id);
    await element.updateComplete;

    rows = element.shadowRoot?.querySelectorAll("brew-list-row");
    // brew1 re-brewed now (newer lastBrewedAt), should jump to top
    expect(rows?.[0].getAttribute("href")).toBe(`/saved/${brew1.id}`);
    expect(rows?.[1].getAttribute("href")).toBe(`/saved/${brew2.id}`);
  });
});
