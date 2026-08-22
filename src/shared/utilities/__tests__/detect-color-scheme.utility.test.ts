import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectColorScheme } from "../detect-color-scheme.utility";

describe("detect-color-scheme.utility", () => {
  const matchMediaMock = (matches: boolean): ReturnType<typeof vi.fn> =>
    vi.fn().mockReturnValue({ matches }) as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.unstubAllGlobals();
  });

  it("sets data-theme=dark when the stored preference is dark", () => {
    localStorage.setItem("theme", "dark");
    vi.stubGlobal("matchMedia", matchMediaMock(false));

    detectColorScheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("leaves data-theme unset when the stored preference is light, even if the OS prefers dark", () => {
    localStorage.setItem("theme", "light");
    vi.stubGlobal("matchMedia", matchMediaMock(true));

    detectColorScheme();

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("falls back to the OS preference when no theme is stored", () => {
    vi.stubGlobal("matchMedia", matchMediaMock(true));

    detectColorScheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("defaults to light when nothing is stored and the OS prefers light", () => {
    vi.stubGlobal("matchMedia", matchMediaMock(false));

    detectColorScheme();

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("defaults to light without throwing when matchMedia isn't supported", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(() => detectColorScheme()).not.toThrow();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
