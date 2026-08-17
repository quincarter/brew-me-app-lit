import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isWakeLockSupported, setWakeLockActive } from "../wake-lock.utility";

describe("wake-lock.utility", () => {
  describe("isWakeLockSupported", () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "wakeLock");
    });

    it("is false when navigator.wakeLock is absent", () => {
      expect(isWakeLockSupported()).toBe(false);
    });

    it("is true when navigator.wakeLock exists", () => {
      Object.defineProperty(navigator, "wakeLock", { value: {}, configurable: true });

      expect(isWakeLockSupported()).toBe(true);
    });
  });

  describe("setWakeLockActive", () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const sentinel = {
      release,
      addEventListener: vi.fn(),
    };
    const request = vi.fn().mockResolvedValue(sentinel);

    beforeEach(() => {
      release.mockClear();
      sentinel.addEventListener.mockClear();
      request.mockClear();
      Object.defineProperty(navigator, "wakeLock", {
        value: { request },
        configurable: true,
      });
    });

    afterEach(() => {
      setWakeLockActive(false);
      Reflect.deleteProperty(navigator, "wakeLock");
    });

    it("requests a screen wake lock when activated", async () => {
      setWakeLockActive(true);
      await vi.waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    });

    it("releases the held wake lock when deactivated", async () => {
      setWakeLockActive(true);
      await vi.waitFor(() => expect(request).toHaveBeenCalled());

      setWakeLockActive(false);

      expect(release).toHaveBeenCalled();
    });

    it("is a no-op when the Wake Lock API is unsupported", () => {
      Reflect.deleteProperty(navigator, "wakeLock");

      expect(() => setWakeLockActive(true)).not.toThrow();
      expect(request).not.toHaveBeenCalled();
    });
  });
});
