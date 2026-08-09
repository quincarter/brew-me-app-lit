import { afterEach, describe, expect, it, vi } from "vitest";
import { buildShareUrl, parseShareParams, shareBrew } from "../share.utility";

describe("share.utility", () => {
  describe("buildShareUrl", () => {
    it("builds an absolute share URL carrying every brew field", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );
      expect(url).toBe(
        "https://brewme.app/share?brewType=Pour-over&ratio=16&water=480&coffee=30&oz=16.93",
      );
    });

    it("adds a name param when the brew has a custom name", () => {
      const url = buildShareUrl(
        {
          brewType: "Pour-over",
          name: "Sunday morning pour",
          ratio: 16,
          water: 480,
          coffee: 30,
          oz: 16.93,
        },
        "https://brewme.app",
      );
      expect(url).toBe(
        "https://brewme.app/share?brewType=Pour-over&ratio=16&water=480&coffee=30&oz=16.93&name=Sunday+morning+pour",
      );
    });

    it("omits the name param entirely when the brew has no name", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );
      expect(url).not.toContain("name=");
    });
  });

  describe("parseShareParams", () => {
    it("parses a valid query string back into a brew", () => {
      expect(parseShareParams("?brewType=Pour-over&ratio=16&water=480&coffee=30&oz=16.93")).toEqual(
        {
          brewType: "Pour-over",
          ratio: 16,
          water: 480,
          coffee: 30,
          oz: 16.93,
        },
      );
    });

    it("round-trips brew types containing spaces", () => {
      const url = buildShareUrl(
        { brewType: "Cold Brew", ratio: 4, water: 400, coffee: 100, oz: 14.11 },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      expect(parseShareParams(search)?.brewType).toBe("Cold Brew");
    });

    it("returns null when the brew type is missing", () => {
      expect(parseShareParams("?ratio=16&water=480&coffee=30&oz=16.93")).toBeNull();
    });

    it("returns null when a numeric field is non-numeric or non-positive", () => {
      expect(
        parseShareParams("?brewType=Pour-over&ratio=0&water=480&coffee=30&oz=16.93"),
      ).toBeNull();
      expect(
        parseShareParams("?brewType=Pour-over&ratio=abc&water=480&coffee=30&oz=16.93"),
      ).toBeNull();
    });

    it("round-trips a custom name through buildShareUrl and parseShareParams", () => {
      const url = buildShareUrl(
        {
          brewType: "Pour-over",
          name: "Sunday morning pour",
          ratio: 16,
          water: 480,
          coffee: 30,
          oz: 16.93,
        },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      expect(parseShareParams(search)).toEqual({
        brewType: "Pour-over",
        name: "Sunday morning pour",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.93,
      });
    });

    it("omits the name key entirely when the URL carries no name param", () => {
      const url = buildShareUrl(
        { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 },
        "https://brewme.app",
      );
      const search = url.slice(url.indexOf("?"));
      const parsed = parseShareParams(search);
      expect(parsed).not.toBeNull();
      expect("name" in (parsed as object)).toBe(false);
    });
  });

  describe("shareBrew", () => {
    const brew = { brewType: "Pour-over", ratio: 16, water: 480, coffee: 30, oz: 16.93 };

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("uses the native share sheet with text built from the custom name when set", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share });

      const outcome = await shareBrew({ ...brew, name: "Sunday morning pour" });

      expect(outcome).toBe("shared");
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Sunday morning pour — 16:1 (30g coffee, 480g water)",
        }),
      );
    });

    it("falls back to the brewType in the share text when no name is set", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share });

      await shareBrew(brew);

      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Pour-over — 16:1 (30g coffee, 480g water)",
        }),
      );
    });

    it("falls back to copying the URL to the clipboard when navigator.share is unavailable", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });

      const outcome = await shareBrew(brew);

      expect(outcome).toBe("copied");
      expect(writeText).toHaveBeenCalledWith(buildShareUrl(brew));
    });
  });
});
