import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAllPersistedData } from "../persistent-signal";
import {
  setShowActiveStepBanner,
  setTimerCountStyle,
  showActiveStepBannerSignal,
  timerCountStyleSignal,
} from "../timer-settings.store";

const waitUntilPersisted = async (
  check: (data: Record<string, unknown>) => boolean,
  timeoutMs = 1000,
): Promise<Record<string, unknown>> => {
  const start = Date.now();
  while (true) {
    const data = await getAllPersistedData();
    if (check(data)) {
      return data;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for value to persist to IndexedDB");
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

describe("timer-settings.store", () => {
  beforeEach(() => {
    timerCountStyleSignal.value = "countdown";
    showActiveStepBannerSignal.value = true;
  });

  afterEach(() => {
    timerCountStyleSignal.value = "countdown";
    showActiveStepBannerSignal.value = true;
  });

  describe("timerCountStyleSignal", () => {
    it("defaults to countdown", () => {
      expect(timerCountStyleSignal.value).toBe("countdown");
    });
  });

  describe("showActiveStepBannerSignal", () => {
    it("defaults to true", () => {
      expect(showActiveStepBannerSignal.value).toBe(true);
    });
  });

  describe("setTimerCountStyle", () => {
    it("updates timerCountStyleSignal to countup", () => {
      setTimerCountStyle("countup");

      expect(timerCountStyleSignal.value).toBe("countup");
    });

    it("updates timerCountStyleSignal back to countdown", () => {
      setTimerCountStyle("countup");

      setTimerCountStyle("countdown");

      expect(timerCountStyleSignal.value).toBe("countdown");
    });

    it("round-trips the value through IndexedDB persistence", async () => {
      setTimerCountStyle("countup");

      const data = await waitUntilPersisted((d) => d["timer-count-style"] === "countup");

      expect(data["timer-count-style"]).toBe("countup");
    });
  });

  describe("setShowActiveStepBanner", () => {
    it("updates showActiveStepBannerSignal to false", () => {
      setShowActiveStepBanner(false);

      expect(showActiveStepBannerSignal.value).toBe(false);
    });

    it("updates showActiveStepBannerSignal back to true", () => {
      setShowActiveStepBanner(false);

      setShowActiveStepBanner(true);

      expect(showActiveStepBannerSignal.value).toBe(true);
    });

    it("round-trips the value through IndexedDB persistence", async () => {
      setShowActiveStepBanner(false);

      const data = await waitUntilPersisted((d) => d["timer-show-active-step-banner"] === false);

      expect(data["timer-show-active-step-banner"]).toBe(false);
    });
  });
});
