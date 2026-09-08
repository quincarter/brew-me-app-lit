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
  dragging: boolean;
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

  it("tags every row with a data-section-id matching its section", async () => {
    await mount();

    const ids = [
      ...(element.shadowRoot?.querySelectorAll<HTMLElement>("[data-section-id]") ?? []),
    ].map((row) => row.dataset.sectionId);
    expect(ids).toEqual([
      "brewAgain",
      "quickActions",
      "devices",
      "cloudSync",
      "stats",
      "recentBrews",
      "support",
    ]);
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

  describe("pointer drag-to-reorder", () => {
    afterEach(() => {
      // @ts-expect-error - restoring the stub set by individual tests.
      delete document.elementFromPoint;
    });

    const dragHandleFor = (title: string): Element => {
      const row = rows().find((r) => r.title === title);
      if (!row) throw new Error(`expected a row titled ${title}`);
      const handle = row.shadowRoot?.querySelector("brew-icon-button.drag-handle");
      if (!handle) throw new Error(`expected a drag handle on the ${title} row`);
      return handle;
    };

    // happy-dom doesn't implement `ShadowRoot.elementFromPoint`, so
    // `deepElementFromPoint` (in deep-shadow-dom.utility.ts) would throw if
    // `document.elementFromPoint` resolved straight to a row custom element
    // (which has its own shadow root) - stubbing it to a plain descendant
    // *inside* that row's shadow root instead sidesteps that entirely,
    // matching how a real browser resolves a point over rendered text.
    const descendantOf = (title: string): Element => {
      const row = rows().find((r) => r.title === title);
      if (!row) throw new Error(`expected a row titled ${title}`);
      const headline = row.shadowRoot?.querySelector(".headline");
      if (!headline) throw new Error(`expected a .headline in the ${title} row`);
      return headline;
    };

    it("reorders the dragged row to sit where the row the pointer moved over was", async () => {
      await mount();
      document.elementFromPoint = () => descendantOf("Support BrewMe");

      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
      );
      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointermove", {
          pointerId: 1,
          clientX: 10,
          clientY: 500,
          bubbles: true,
          composed: true,
        }),
      );
      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(rows().map((row) => row.title)[rows().length - 1]).toBe("Brew again");
      expect(homeScreenConfigSignal.value.map((entry) => entry.id)[6]).toBe("brewAgain");
    });

    it("marks the dragged row's dragging property true only while the drag is in progress", async () => {
      await mount();
      document.elementFromPoint = () => descendantOf("Brew again");

      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
      );
      await element.updateComplete;
      expect(rows().find((row) => row.title === "Brew again")?.dragging).toBe(true);

      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
      );
      await element.updateComplete;
      expect(rows().find((row) => row.title === "Brew again")?.dragging).toBe(false);
    });

    it("does not persist a reorder when the drag ends without the order actually changing", async () => {
      await mount();
      document.elementFromPoint = () => descendantOf("Brew again");
      const before = homeScreenConfigSignal.value;

      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
      );
      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(homeScreenConfigSignal.value).toBe(before);
    });

    it("does not reorder when the pointer moves over the row already being dragged", async () => {
      await mount();
      document.elementFromPoint = () => descendantOf("Brew again");
      const before = homeScreenConfigSignal.value;

      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
      );
      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointermove", {
          pointerId: 1,
          clientX: 10,
          clientY: 10,
          bubbles: true,
          composed: true,
        }),
      );
      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerup", { pointerId: 1, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(homeScreenConfigSignal.value).toBe(before);
    });

    it("ends the drag and clears the dragging state on pointercancel, same as pointerup", async () => {
      // Matches `brew-steps-card`'s own `_endDrag`, which is wired to both
      // pointerup and pointercancel identically - neither distinguishes a
      // deliberate drop from an interrupted gesture, both just commit
      // whatever the live preview ended up at.
      await mount();
      document.elementFromPoint = () => descendantOf("Support BrewMe");

      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, composed: true }),
      );
      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointermove", {
          pointerId: 1,
          clientX: 10,
          clientY: 500,
          bubbles: true,
          composed: true,
        }),
      );
      dragHandleFor("Brew again").dispatchEvent(
        new PointerEvent("pointercancel", { pointerId: 1, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(homeScreenConfigSignal.value.map((entry) => entry.id)[6]).toBe("brewAgain");
      expect(rows().find((row) => row.title === "Brew again")?.dragging).toBe(false);
    });
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
