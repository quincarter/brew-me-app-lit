import { describe, expect, it } from "vitest";
import { isWebBluetoothSupported } from "../web-bluetooth.utility";

describe("isWebBluetoothSupported", () => {
  it("is false when navigator.bluetooth is absent", () => {
    expect(isWebBluetoothSupported()).toBe(false);
  });

  it("is true when navigator.bluetooth exists", () => {
    Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });

    try {
      expect(isWebBluetoothSupported()).toBe(true);
    } finally {
      Reflect.deleteProperty(navigator, "bluetooth");
    }
  });
});
