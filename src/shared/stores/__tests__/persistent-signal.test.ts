import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPersistentSignals,
  getAllPersistedData,
  persistentSignal,
  replaceAllPersistedData,
} from "../persistent-signal";

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

describe("persistent-signal", () => {
  beforeEach(async () => {
    await clearPersistentSignals();
  });

  describe("getAllPersistedData", () => {
    it("returns an empty object when nothing has been persisted", async () => {
      expect(await getAllPersistedData()).toEqual({});
    });

    it("returns a single persisted key/value pair", async () => {
      const value = persistentSignal("brewing", { key: "test-single" });
      value.value = "espresso";

      const data = await waitUntilPersisted((d) => d["test-single"] === "espresso");

      expect(data).toEqual({ "test-single": "espresso" });
    });

    it("reflects multiple persisted keys, each zipped to its own value", async () => {
      const a = persistentSignal(0, { key: "test-a" });
      const b = persistentSignal({ x: 1 }, { key: "test-b" });
      a.value = 42;
      b.value = { x: 2 };

      const data = await waitUntilPersisted((d) => d["test-a"] === 42 && "test-b" in d);

      expect(data).toEqual({ "test-a": 42, "test-b": { x: 2 } });
    });

    it("reflects the latest value after multiple updates, not a stale one", async () => {
      const value = persistentSignal("first", { key: "test-update" });
      value.value = "second";
      value.value = "third";

      const data = await waitUntilPersisted((d) => d["test-update"] === "third");

      expect(data).toEqual({ "test-update": "third" });
    });
  });

  describe("replaceAllPersistedData", () => {
    it("populates an empty store with the given data", async () => {
      await replaceAllPersistedData({ "test-a": 1, "test-b": "brewing" });

      expect(await getAllPersistedData()).toEqual({ "test-a": 1, "test-b": "brewing" });
    });

    it("replaces an existing store's contents, dropping keys not present in the new payload", async () => {
      await replaceAllPersistedData({ "test-old": "stale", "test-shared": "before" });

      await replaceAllPersistedData({ "test-shared": "after", "test-new": "fresh" });

      const data = await getAllPersistedData();
      expect(data).toEqual({ "test-shared": "after", "test-new": "fresh" });
      expect(data).not.toHaveProperty("test-old");
    });

    it("replacing with an empty object clears the store entirely", async () => {
      await replaceAllPersistedData({ "test-a": 1, "test-b": 2 });

      await replaceAllPersistedData({});

      expect(await getAllPersistedData()).toEqual({});
    });

    it("round-trips arrays and objects, not just primitives", async () => {
      const savedBrews = [
        { id: "1", name: "Morning V60", ratio: 16 },
        { id: "2", name: "Afternoon Chemex", ratio: 15 },
      ];
      const settings = { darkMode: true, customTypes: ["Siphon", "Turkish"] };

      await replaceAllPersistedData({ "saved-brews": savedBrews, settings });

      const data = await getAllPersistedData();
      expect(data["saved-brews"]).toEqual(savedBrews);
      expect(data.settings).toEqual(settings);
    });
  });
});
