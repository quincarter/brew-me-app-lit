import { describe, expect, it } from "vitest";
import { formatSeconds } from "../format-time.utility";

describe("format-time.utility", () => {
  it("formats whole minutes", () => {
    expect(formatSeconds(0)).toBe("00:00");
    expect(formatSeconds(60)).toBe("01:00");
  });

  it("pads seconds under 10", () => {
    expect(formatSeconds(65)).toBe("01:05");
  });

  it("keeps counting minutes past an hour", () => {
    expect(formatSeconds(3661)).toBe("61:01");
  });
});
