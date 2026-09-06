import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOnlineSignal, onReconnect } from "../connectivity.utility";

describe("connectivity.utility", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("mirrors navigator.onLine through the online/offline events", () => {
    window.dispatchEvent(new Event("offline"));
    expect(isOnlineSignal.value).toBe(false);

    window.dispatchEvent(new Event("online"));
    expect(isOnlineSignal.value).toBe(true);
  });

  describe("onReconnect", () => {
    let unsubscribe: () => void;

    beforeEach(() => {
      unsubscribe = () => {};
    });

    afterEach(() => {
      unsubscribe();
    });

    it("invokes the callback when the online event fires", () => {
      const callback = vi.fn();
      unsubscribe = onReconnect(callback);

      window.dispatchEvent(new Event("online"));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("stops invoking the callback after unsubscribing", () => {
      const callback = vi.fn();
      unsubscribe = onReconnect(callback);
      unsubscribe();

      window.dispatchEvent(new Event("online"));

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
