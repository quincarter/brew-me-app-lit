import { describe, expect, it } from "vitest";
import { getAvatarColors, getInitial } from "../avatar-palette.utility";

describe("avatar-palette.utility", () => {
  it("cycles through the palette by index", () => {
    const first = getAvatarColors(0);
    const fourth = getAvatarColors(3);
    expect(first).toEqual(fourth);
  });

  it("returns an uppercase initial", () => {
    expect(getInitial("v60")).toBe("V");
    expect(getInitial("")).toBe("?");
  });
});
