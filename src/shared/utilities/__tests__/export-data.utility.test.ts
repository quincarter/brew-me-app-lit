import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as persistentSignalModule from "../../stores/persistent-signal";
import {
  buildExportFilename,
  buildExportPayload,
  downloadJsonFile,
  exportAppData,
  importAppData,
  parseImportPayload,
  readFileAsText,
} from "../export-data.utility";
import { REAL_DEVICE_EXPORT_RAW as REAL_EXPORT_RAW } from "./fixtures/real-device-export.fixture";

describe("export-data.utility", () => {
  describe("buildExportPayload", () => {
    it("always tags the payload with app: 'brew-me'", () => {
      const payload = buildExportPayload({}, new Date(2026, 0, 1));

      expect(payload.app).toBe("brew-me");
    });

    it("passes the given data through unchanged", () => {
      const data = { "saved-brews": [{ id: "1" }], "custom-brew-types": ["Siphon"] };

      const payload = buildExportPayload(data, new Date(2026, 0, 1));

      expect(payload.data).toBe(data);
    });

    it("uses the passed date's ISO string for exportedAt", () => {
      const date = new Date(2026, 7, 9, 12, 30, 0);

      const payload = buildExportPayload({}, date);

      expect(payload.exportedAt).toBe(date.toISOString());
    });

    it("defaults exportedAt to now when no date is passed", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 9, 12, 30, 0));

      const payload = buildExportPayload({});

      expect(payload.exportedAt).toBe(new Date(2026, 7, 9, 12, 30, 0).toISOString());

      vi.useRealTimers();
    });
  });

  describe("buildExportFilename", () => {
    it("zero-pads single-digit months and days", () => {
      const filename = buildExportFilename(new Date(2026, 0, 5));

      expect(filename).toBe("brew-me-export-2026-01-05.json");
    });

    it("does not pad double-digit months and days", () => {
      const filename = buildExportFilename(new Date(2026, 10, 23));

      expect(filename).toBe("brew-me-export-2026-11-23.json");
    });

    it("defaults to the current date when no date is passed", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 9));

      expect(buildExportFilename()).toBe("brew-me-export-2026-08-09.json");

      vi.useRealTimers();
    });
  });

  describe("downloadJsonFile", () => {
    let createObjectURL: ReturnType<typeof vi.fn>;
    let revokeObjectURL: ReturnType<typeof vi.fn>;
    let clickSpy: ReturnType<typeof vi.spyOn>;
    let appendSpy: ReturnType<typeof vi.spyOn>;
    let removeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });

      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      appendSpy = vi.spyOn(document.body, "appendChild");
      removeSpy = vi.spyOn(document.body, "removeChild");
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("builds a Blob with the JSON-stringified payload and application/json type", () => {
      const payload = { app: "brew-me", data: { foo: "bar" } };

      downloadJsonFile("brew-me-export-2026-08-09.json", payload);

      const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("application/json");
    });

    it("sets the anchor's download attribute to the given filename", () => {
      downloadJsonFile("brew-me-export-2026-08-09.json", { data: {} });

      const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
      expect(anchor.download).toBe("brew-me-export-2026-08-09.json");
      expect(anchor.href).toContain("blob:mock-url");
    });

    it("appends the anchor, clicks it, then removes it, then revokes the object URL", () => {
      downloadJsonFile("brew-me-export-2026-08-09.json", { data: {} });

      expect(appendSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

      const appendOrder = appendSpy.mock.invocationCallOrder[0] ?? 0;
      const clickOrder = clickSpy.mock.invocationCallOrder[0] ?? 0;
      const removeOrder = removeSpy.mock.invocationCallOrder[0] ?? 0;
      const revokeOrder = revokeObjectURL.mock.invocationCallOrder[0] ?? 0;
      expect(appendOrder).toBeLessThan(clickOrder);
      expect(clickOrder).toBeLessThan(removeOrder);
      expect(removeOrder).toBeLessThan(revokeOrder);
    });
  });

  describe("exportAppData", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("reads persisted data, builds a payload and filename, and downloads it", async () => {
      const data = { "saved-brews": [{ id: "1" }] };
      vi.spyOn(persistentSignalModule, "getAllPersistedData").mockResolvedValue(data);

      let capturedFilename: string | undefined;
      const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
        capturedFilename = (node as HTMLAnchorElement).download;
        return node;
      });
      vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 9));

      await exportAppData();

      vi.useRealTimers();

      const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
      const parsed = JSON.parse(await blob.text()) as { app: string; data: unknown };

      expect(persistentSignalModule.getAllPersistedData).toHaveBeenCalledTimes(1);
      expect(capturedFilename).toBe("brew-me-export-2026-08-09.json");
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(parsed.app).toBe("brew-me");
      expect(parsed.data).toEqual(data);

      vi.unstubAllGlobals();
    });

    it("propagates a rejection from getAllPersistedData instead of swallowing it", async () => {
      vi.spyOn(persistentSignalModule, "getAllPersistedData").mockRejectedValue(
        new Error("IndexedDB unavailable"),
      );

      await expect(exportAppData()).rejects.toThrow("IndexedDB unavailable");
    });
  });

  describe("parseImportPayload", () => {
    it("returns data unchanged for a valid payload", () => {
      const raw = JSON.stringify({
        app: "brew-me",
        exportedAt: "2026-08-09T00:00:00.000Z",
        data: { "saved-brews": [{ id: "1" }] },
      });

      expect(parseImportPayload(raw)).toEqual({ "saved-brews": [{ id: "1" }] });
    });

    it("throws for malformed JSON", () => {
      expect(() => parseImportPayload("{not valid json")).toThrow();
    });

    it("throws when app is missing", () => {
      const raw = JSON.stringify({ data: {} });

      expect(() => parseImportPayload(raw)).toThrow("Not a valid BrewMe export file.");
    });

    it("throws when app is the wrong value", () => {
      const raw = JSON.stringify({ app: "some-other-app", data: {} });

      expect(() => parseImportPayload(raw)).toThrow("Not a valid BrewMe export file.");
    });

    it("throws when data is missing", () => {
      const raw = JSON.stringify({ app: "brew-me" });

      expect(() => parseImportPayload(raw)).toThrow("Not a valid BrewMe export file.");
    });

    it("throws when data is null", () => {
      const raw = JSON.stringify({ app: "brew-me", data: null });

      expect(() => parseImportPayload(raw)).toThrow("Not a valid BrewMe export file.");
    });

    it("throws when data is an array instead of an object", () => {
      const raw = JSON.stringify({ app: "brew-me", data: [1, 2, 3] });

      expect(() => parseImportPayload(raw)).toThrow("Not a valid BrewMe export file.");
    });

    it.each([["5"], ["null"], ["[]"]])(
      "throws when the top-level parsed value isn't an object (%s)",
      (raw) => {
        expect(() => parseImportPayload(raw)).toThrow("Not a valid BrewMe export file.");
      },
    );

    it("parses a real ~1.4MB device export (5 saved brews, 10 saved shots with embedded telemetry) without throwing", () => {
      const data = parseImportPayload(REAL_EXPORT_RAW);

      expect(data["saved-brews"]).toHaveLength(5);
      expect(data["saved-shots"]).toHaveLength(10);
    });
  });

  describe("readFileAsText", () => {
    it("resolves with the file's text content", async () => {
      const file = new File(["hello brew"], "brew.txt", { type: "text/plain" });

      await expect(readFileAsText(file)).resolves.toBe("hello brew");
    });

    it("resolves with JSON file contents unchanged", async () => {
      const json = JSON.stringify({ app: "brew-me", data: {} });
      const file = new File([json], "export.json", { type: "application/json" });

      await expect(readFileAsText(file)).resolves.toBe(json);
    });
  });

  describe("importAppData", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("reads, parses, and replaces persisted data with the file's contents", async () => {
      const data = { "saved-brews": [{ id: "1" }] };
      const file = new File([JSON.stringify({ app: "brew-me", data })], "export.json", {
        type: "application/json",
      });
      const replaceSpy = vi
        .spyOn(persistentSignalModule, "replaceAllPersistedData")
        .mockResolvedValue(undefined);

      await importAppData(file);

      expect(replaceSpy).toHaveBeenCalledWith(data);
    });

    it("propagates a rejection from malformed JSON instead of swallowing it", async () => {
      const file = new File(["{not valid json"], "export.json", { type: "application/json" });

      await expect(importAppData(file)).rejects.toThrow();
    });

    it("propagates a rejection from an invalid payload shape instead of swallowing it", async () => {
      const file = new File([JSON.stringify({ app: "not-brew-me" })], "export.json", {
        type: "application/json",
      });

      await expect(importAppData(file)).rejects.toThrow("Not a valid BrewMe export file.");
    });

    it("propagates a rejection from replaceAllPersistedData instead of swallowing it", async () => {
      const file = new File([JSON.stringify({ app: "brew-me", data: {} })], "export.json", {
        type: "application/json",
      });
      vi.spyOn(persistentSignalModule, "replaceAllPersistedData").mockRejectedValue(
        new Error("IndexedDB unavailable"),
      );

      await expect(importAppData(file)).rejects.toThrow("IndexedDB unavailable");
    });

    it("replaces persisted data with a real ~1.4MB device export's full contents, unmodified", async () => {
      const file = new File([REAL_EXPORT_RAW], "brew-me-export-2026-08-16.json", {
        type: "application/json",
      });
      const replaceSpy = vi
        .spyOn(persistentSignalModule, "replaceAllPersistedData")
        .mockResolvedValue(undefined);

      await importAppData(file);

      const passedData = replaceSpy.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(passedData["saved-brews"]).toHaveLength(5);
      expect(passedData["saved-shots"]).toHaveLength(10);
    });
  });
});
