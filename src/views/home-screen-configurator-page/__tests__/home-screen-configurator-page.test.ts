import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getVisibleHomeScreenSections,
  homeScreenConfigSignal,
  resetHomeScreenConfig,
  setHomeScreenSectionVisible,
} from "../../../shared/stores/home-screen-config.store";
import "../home-screen-configurator-page";
import type { HomeScreenConfiguratorPage } from "../home-screen-configurator-page";

type ConfigRowElement = HTMLElement & {
  title: string;
  visible: boolean;
  disableMoveUp: boolean;
  disableMoveDown: boolean;
};

describe("home-screen-configurator-page", () => {
  let element: HomeScreenConfiguratorPage;

  const mount = async (): Promise<void> => {
    element = document.createElement("home-screen-configurator-page") as HomeScreenConfiguratorPage;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  const rows = (): ConfigRowElement[] =>
    [
      ...(element.shadowRoot?.querySelectorAll("brew-home-screen-config-row") ?? []),
    ] as ConfigRowElement[];

  beforeEach(() => {
    resetHomeScreenConfig();
    Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "test-client-id");
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
  });

  afterEach(() => {
    element.remove();
    resetHomeScreenConfig();
    Reflect.deleteProperty(navigator, "bluetooth");
    vi.unstubAllEnvs();
  });

  it("renders the bottom nav with 'more' highlighted, matching Settings (which this screen is reached from)", async () => {
    await mount();

    const nav = element.shadowRoot?.querySelector("brew-bottom-nav");
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute("active")).toBe("more");
  });

  it("renders one row per available section, in display order, all visible by default", async () => {
    await mount();

    const titles = rows().map((row) => row.title);
    expect(titles).toEqual([
      "Brew again",
      "Quick actions",
      "Devices",
      "Cloud Sync",
      "Stats",
      "Recent brews",
      "Support BrewMe",
    ]);
    expect(rows().every((row) => row.visible)).toBe(true);
  });

  it("renders a row unchecked on a fresh mount when its section was already hidden before mounting", async () => {
    // Regression test for the reported bug: hide a section, navigate away
    // (destroying this page's element), then navigate back (a brand new
    // element, never having existed with the attribute set before). The
    // row for that section must render unchecked from its very first
    // render - not just after a later toggle mutates an already-existing
    // element, which is the only path the other tests here exercise.
    setHomeScreenSectionVisible("stats", false);
    setHomeScreenSectionVisible("support", false);

    await mount();

    const statsRow = rows().find((row) => row.title === "Stats");
    const supportRow = rows().find((row) => row.title === "Support BrewMe");
    expect(statsRow?.visible).toBe(false);
    expect(supportRow?.visible).toBe(false);

    const statsSwitch = statsRow?.shadowRoot?.querySelector("brew-switch") as HTMLElement & {
      checked: boolean;
    };
    expect(statsSwitch.checked).toBe(false);
  });

  it("disables move-up on the first row and move-down on the last row only", async () => {
    await mount();

    const rowList = rows();
    expect(rowList[0].disableMoveUp).toBe(true);
    expect(rowList[0].disableMoveDown).toBe(false);
    expect(rowList[rowList.length - 1].disableMoveDown).toBe(true);
    expect(rowList[rowList.length - 1].disableMoveUp).toBe(false);
    expect(rowList[3].disableMoveUp).toBe(false);
    expect(rowList[3].disableMoveDown).toBe(false);
  });

  it("omits the Devices row entirely when Web Bluetooth is unsupported", async () => {
    Reflect.deleteProperty(navigator, "bluetooth");
    await mount();

    expect(rows().map((row) => row.title)).not.toContain("Devices");
  });

  it("omits the Cloud Sync row entirely when no provider is configured", async () => {
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
    await mount();

    expect(rows().map((row) => row.title)).not.toContain("Cloud Sync");
  });

  it("hides a section on Home when its row's switch is turned off", async () => {
    await mount();
    expect(getVisibleHomeScreenSections()).toContain("stats");

    const statsRow = rows().find((row) => row.title === "Stats");
    statsRow?.dispatchEvent(
      new CustomEvent("visibility-change", { detail: false, bubbles: true, composed: true }),
    );
    await element.updateComplete;

    expect(getVisibleHomeScreenSections()).not.toContain("stats");
    expect(rows().find((row) => row.title === "Stats")?.visible).toBe(false);
  });

  it("reorders sections when a row fires move-up-click/move-down-click", async () => {
    await mount();

    const supportRow = rows().find((row) => row.title === "Support BrewMe");
    supportRow?.dispatchEvent(new CustomEvent("move-up-click", { bubbles: true, composed: true }));
    await element.updateComplete;

    const titles = rows().map((row) => row.title);
    expect(titles.indexOf("Support BrewMe")).toBeLessThan(titles.indexOf("Recent brews"));
  });

  it("restores the default order and visibility when 'Reset to default' is activated", async () => {
    await mount();

    const statsRow = rows().find((row) => row.title === "Stats");
    statsRow?.dispatchEvent(
      new CustomEvent("visibility-change", { detail: false, bubbles: true, composed: true }),
    );
    await element.updateComplete;
    expect(getVisibleHomeScreenSections()).not.toContain("stats");

    const resetButton = element.shadowRoot?.querySelector("brew-button");
    const inner = resetButton?.shadowRoot?.querySelector("button");
    inner?.dispatchEvent(new Event("click", { bubbles: true }));
    await element.updateComplete;

    expect(getVisibleHomeScreenSections()).toContain("stats");
    expect(homeScreenConfigSignal.value.every((entry) => entry.visible)).toBe(true);
  });
});
