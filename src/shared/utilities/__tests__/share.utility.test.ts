import { describe, expect, it } from "vitest";
import { buildShareUrl, parseShareParams } from "../share.utility";

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
  });
});
