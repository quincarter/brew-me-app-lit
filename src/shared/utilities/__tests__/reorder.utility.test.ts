import { describe, expect, it } from "vitest";
import { moveItem } from "../reorder.utility";

describe("moveItem", () => {
  it("moves an item down (to a later index)", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item up (to an earlier index)", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("is a no-op that returns a new array when fromIndex === toIndex", () => {
    const input = ["a", "b", "c"];
    const result = moveItem(input, 1, 1);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  it("does not mutate the input array", () => {
    const input = ["a", "b", "c"];
    moveItem(input, 0, 2);

    expect(input).toEqual(["a", "b", "c"]);
  });

  it("moves the first item to the last index", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves the last item to the first index", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("returns a shallow copy unchanged when fromIndex is out of bounds", () => {
    const input = ["a", "b", "c"];
    expect(moveItem(input, -1, 1)).toEqual(input);
    expect(moveItem(input, 3, 1)).toEqual(input);
  });

  it("returns a shallow copy unchanged when toIndex is out of bounds", () => {
    const input = ["a", "b", "c"];
    expect(moveItem(input, 0, -1)).toEqual(input);
    expect(moveItem(input, 0, 3)).toEqual(input);
  });

  it("works with a single-item array", () => {
    expect(moveItem(["only"], 0, 0)).toEqual(["only"]);
  });
});
