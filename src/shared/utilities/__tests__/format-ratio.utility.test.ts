import { describe, expect, it } from "vitest";
import { formatRatio } from "../format-ratio.utility";

describe("format-ratio.utility", () => {
  it("formats a whole-number ratio as 1:{ratio}", () => {
    expect(formatRatio(16)).toBe("1:16");
  });

  it("formats a fractional ratio as 1:{ratio}", () => {
    expect(formatRatio(15.5)).toBe("1:15.5");
  });

  it("formats a zero ratio as 1:0", () => {
    expect(formatRatio(0)).toBe("1:0");
  });
});
