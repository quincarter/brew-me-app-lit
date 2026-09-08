import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../settings-page";
import type { SettingsPage } from "../settings-page";

describe("settings-page", () => {
  let element: SettingsPage;

  beforeEach(async () => {
    element = document.createElement("settings-page") as SettingsPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const rowFor = (headline: string): Element | undefined =>
    Array.from(element.shadowRoot?.querySelectorAll("brew-list-row") ?? []).find(
      (row) => row.getAttribute("headline") === headline,
    );

  it("renders a top-bar back link to More", () => {
    const topBar = element.shadowRoot?.querySelector("brew-top-bar");
    expect(topBar?.getAttribute("href")).toBe("/more");
  });

  it("links Brew Type Settings to /more/settings/brew-types", () => {
    expect(rowFor("Brew Type Settings")?.getAttribute("href")).toBe("/more/settings/brew-types");
  });

  it("links Display to /more/settings/display", () => {
    expect(rowFor("Display")?.getAttribute("href")).toBe("/more/settings/display");
  });

  it("links Data to /more/settings/data", () => {
    expect(rowFor("Data")?.getAttribute("href")).toBe("/more/settings/data");
  });

  it("links General to /more/settings/general", () => {
    expect(rowFor("General")?.getAttribute("href")).toBe("/more/settings/general");
  });
});
