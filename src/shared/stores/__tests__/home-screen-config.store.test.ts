import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAvailableHomeScreenConfig,
  getVisibleHomeScreenSections,
  homeScreenConfigSignal,
  isHomeScreenSectionAvailable,
  moveHomeScreenSection,
  orderedHomeScreenConfigSignal,
  resetHomeScreenConfig,
  setHomeScreenSectionVisible,
} from "../home-screen-config.store";

const DEFAULT_ORDER = [
  "brewAgain",
  "quickActions",
  "devices",
  "cloudSync",
  "stats",
  "recentBrews",
  "support",
];

describe("home-screen-config.store", () => {
  beforeEach(() => {
    resetHomeScreenConfig();
    Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "test-client-id");
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
  });

  afterEach(() => {
    resetHomeScreenConfig();
    Reflect.deleteProperty(navigator, "bluetooth");
    vi.unstubAllEnvs();
  });

  describe("homeScreenConfigSignal defaults", () => {
    it("defaults to every section visible in the original Home layout order", () => {
      expect(homeScreenConfigSignal.value.map((entry) => entry.id)).toEqual(DEFAULT_ORDER);
      expect(homeScreenConfigSignal.value.every((entry) => entry.visible)).toBe(true);
    });
  });

  describe("isHomeScreenSectionAvailable", () => {
    it("is true for devices when Web Bluetooth is supported", () => {
      expect(isHomeScreenSectionAvailable("devices")).toBe(true);
    });

    it("is false for devices when Web Bluetooth is unsupported", () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      expect(isHomeScreenSectionAvailable("devices")).toBe(false);
    });

    it("is true for cloudSync when a provider is configured", () => {
      expect(isHomeScreenSectionAvailable("cloudSync")).toBe(true);
    });

    it("is false for cloudSync when no provider is configured", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      expect(isHomeScreenSectionAvailable("cloudSync")).toBe(false);
    });

    it("is always true for sections with no availability gate", () => {
      expect(isHomeScreenSectionAvailable("brewAgain")).toBe(true);
      expect(isHomeScreenSectionAvailable("stats")).toBe(true);
    });
  });

  describe("orderedHomeScreenConfigSignal", () => {
    it("drops unrecognized persisted ids and appends missing known sections, defaulted to visible", () => {
      homeScreenConfigSignal.value = [
        { id: "stats", visible: false },
        // @ts-expect-error - simulating a stale persisted id from a removed section
        { id: "retiredSection", visible: true },
      ];

      const ids = orderedHomeScreenConfigSignal.value.map((entry) => entry.id);
      expect(ids).toContain("stats");
      expect(ids).not.toContain("retiredSection");
      expect(new Set(ids)).toEqual(new Set(DEFAULT_ORDER));

      const recentBrews = orderedHomeScreenConfigSignal.value.find(
        (entry) => entry.id === "recentBrews",
      );
      expect(recentBrews?.visible).toBe(true);
    });
  });

  describe("visibleHomeScreenSectionsSignal", () => {
    it("includes every section by default", () => {
      expect(getVisibleHomeScreenSections()).toEqual(DEFAULT_ORDER);
    });

    it("excludes a section hidden via setHomeScreenSectionVisible", () => {
      setHomeScreenSectionVisible("stats", false);

      expect(getVisibleHomeScreenSections()).not.toContain("stats");
    });

    it("excludes devices even if marked visible, when Web Bluetooth is unsupported", () => {
      Reflect.deleteProperty(navigator, "bluetooth");

      expect(getVisibleHomeScreenSections()).not.toContain("devices");
    });

    it("excludes cloudSync even if marked visible, when no provider is configured", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");

      expect(getVisibleHomeScreenSections()).not.toContain("cloudSync");
    });

    it("reflects reordering", () => {
      moveHomeScreenSection("support", "up");

      const ids = getVisibleHomeScreenSections();
      expect(ids.indexOf("support")).toBeLessThan(ids.indexOf("recentBrews"));
    });
  });

  describe("setHomeScreenSectionVisible", () => {
    it("hides a section", () => {
      setHomeScreenSectionVisible("support", false);

      const entry = orderedHomeScreenConfigSignal.value.find((e) => e.id === "support");
      expect(entry?.visible).toBe(false);
    });

    it("shows a previously-hidden section again", () => {
      setHomeScreenSectionVisible("support", false);
      setHomeScreenSectionVisible("support", true);

      const entry = orderedHomeScreenConfigSignal.value.find((e) => e.id === "support");
      expect(entry?.visible).toBe(true);
    });
  });

  describe("moveHomeScreenSection", () => {
    it("moves a section earlier in display order", () => {
      moveHomeScreenSection("recentBrews", "up");

      const ids = orderedHomeScreenConfigSignal.value.map((entry) => entry.id);
      expect(ids.indexOf("recentBrews")).toBeLessThan(ids.indexOf("stats"));
    });

    it("moves a section later in display order", () => {
      moveHomeScreenSection("brewAgain", "down");

      const ids = orderedHomeScreenConfigSignal.value.map((entry) => entry.id);
      expect(ids.indexOf("brewAgain")).toBeGreaterThan(ids.indexOf("quickActions"));
    });

    it("is a no-op moving the first section up", () => {
      moveHomeScreenSection("brewAgain", "up");

      expect(orderedHomeScreenConfigSignal.value.map((entry) => entry.id)).toEqual(DEFAULT_ORDER);
    });

    it("is a no-op moving the last section down", () => {
      moveHomeScreenSection("support", "down");

      expect(orderedHomeScreenConfigSignal.value.map((entry) => entry.id)).toEqual(DEFAULT_ORDER);
    });

    it("skips past an unavailable section instead of swapping with its invisible slot", () => {
      // devices sits between quickActions and cloudSync in DEFAULT_ORDER -
      // moving cloudSync up while Bluetooth is unsupported must land it
      // before quickActions, not swap it with the (invisible) devices slot.
      Reflect.deleteProperty(navigator, "bluetooth");

      moveHomeScreenSection("cloudSync", "up");

      const ids = orderedHomeScreenConfigSignal.value.map((entry) => entry.id);
      expect(ids.indexOf("cloudSync")).toBeLessThan(ids.indexOf("quickActions"));
    });

    it("skips past multiple consecutive unavailable sections in one move", () => {
      // devices and cloudSync are both unavailable here, sitting between
      // quickActions and stats - moving stats up must jump over both in a
      // single move rather than needing two separate up-clicks.
      Reflect.deleteProperty(navigator, "bluetooth");
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");

      moveHomeScreenSection("stats", "up");

      const ids = orderedHomeScreenConfigSignal.value.map((entry) => entry.id);
      expect(ids.indexOf("stats")).toBeLessThan(ids.indexOf("quickActions"));
    });
  });

  describe("getAvailableHomeScreenConfig", () => {
    it("includes every section, hidden or not, when everything is available", () => {
      setHomeScreenSectionVisible("stats", false);

      const ids = getAvailableHomeScreenConfig().map((entry) => entry.id);
      expect(ids).toEqual(DEFAULT_ORDER);
    });

    it("drops devices entirely when Web Bluetooth is unsupported", () => {
      Reflect.deleteProperty(navigator, "bluetooth");

      const ids = getAvailableHomeScreenConfig().map((entry) => entry.id);
      expect(ids).not.toContain("devices");
    });

    it("drops cloudSync entirely when no provider is configured", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");

      const ids = getAvailableHomeScreenConfig().map((entry) => entry.id);
      expect(ids).not.toContain("cloudSync");
    });

    it("keeps a hidden-but-available section's visible:false flag intact", () => {
      setHomeScreenSectionVisible("support", false);

      const support = getAvailableHomeScreenConfig().find((entry) => entry.id === "support");
      expect(support?.visible).toBe(false);
    });
  });

  describe("resetHomeScreenConfig", () => {
    it("restores the default order and visibility", () => {
      setHomeScreenSectionVisible("stats", false);
      moveHomeScreenSection("support", "up");

      resetHomeScreenConfig();

      expect(homeScreenConfigSignal.value.map((entry) => entry.id)).toEqual(DEFAULT_ORDER);
      expect(homeScreenConfigSignal.value.every((entry) => entry.visible)).toBe(true);
    });
  });
});
