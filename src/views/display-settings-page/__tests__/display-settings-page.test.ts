import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isDarkThemeSignal, setDarkTheme } from "../../../shared/stores/theme.store";
import "../display-settings-page";
import type { DisplaySettingsPage } from "../display-settings-page";

describe("display-settings-page", () => {
  let element: DisplaySettingsPage;

  beforeEach(async () => {
    setDarkTheme(false);
    element = document.createElement("display-settings-page") as DisplaySettingsPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    setDarkTheme(false);
  });

  it("renders a top-bar back link to the Settings hub", () => {
    const topBar = element.shadowRoot?.querySelector("brew-top-bar");
    expect(topBar?.getAttribute("href")).toBe("/more/settings");
  });

  it("reflects the current dark-mode state on the switch", () => {
    const toggle = element.shadowRoot?.querySelector("brew-switch") as
      | (Element & { checked: boolean })
      | null;
    expect(toggle?.checked).toBe(false);
  });

  it("calls setDarkTheme and re-renders the switch checked when its change event fires", async () => {
    const toggle = element.shadowRoot?.querySelector("brew-switch");
    toggle?.dispatchEvent(
      new CustomEvent<boolean>("change", { detail: true, bubbles: true, composed: true }),
    );
    await element.updateComplete;

    expect(isDarkThemeSignal.value).toBe(true);
    const updatedToggle = element.shadowRoot?.querySelector("brew-switch") as
      | (Element & { checked: boolean })
      | null;
    expect(updatedToggle?.checked).toBe(true);
  });

  it("links to the Home Screen Configurator", () => {
    const row = element.shadowRoot?.querySelector("brew-list-row[headline='Home Screen']");
    expect(row?.getAttribute("href")).toBe("/more/settings/home-screen");
  });
});
