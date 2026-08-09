import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeDay } from "../relative-date.utility";

const NOW = new Date(2024, 0, 15, 12, 0, 0).getTime();

describe("relative-date.utility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels a timestamp from earlier today as Today", () => {
    const timestamp = new Date(2024, 0, 15, 8, 0, 0).getTime();
    expect(formatRelativeDay(timestamp)).toBe("Today");
  });

  it("labels a timestamp from late yesterday as Yesterday", () => {
    const timestamp = new Date(2024, 0, 14, 23, 0, 0).getTime();
    expect(formatRelativeDay(timestamp)).toBe("Yesterday");
  });

  it("labels a timestamp a few days back as {n} days ago", () => {
    const timestamp = new Date(2024, 0, 10, 8, 0, 0).getTime();
    expect(formatRelativeDay(timestamp)).toBe("5 days ago");
  });

  it("falls back to a short date beyond the days-ago threshold", () => {
    const timestamp = new Date(2024, 0, 7, 8, 0, 0).getTime();
    expect(formatRelativeDay(timestamp)).toBe("Jan 7");
  });
});
