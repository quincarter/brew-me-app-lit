import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { savedBrewsSignal } from "../../../shared/stores/brew.store";
import { deviceConnectSheetOpenSignal } from "../../../shared/stores/device-connect-sheet.store";
import "../home-page";
import type { HomePage } from "../home-page";

describe("home-page", () => {
  let element: HomePage;

  const mount = async (): Promise<void> => {
    element = document.createElement("home-page") as HomePage;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  beforeEach(() => {
    savedBrewsSignal.value = [];
    deviceConnectSheetOpenSignal.value = false;
  });

  afterEach(() => {
    element.remove();
    Reflect.deleteProperty(navigator, "bluetooth");
    deviceConnectSheetOpenSignal.value = false;
  });

  const devicesTile = (): (HTMLElement & { label: string }) | null =>
    element.shadowRoot?.querySelector(".device-action brew-action-tile") as
      | (HTMLElement & { label: string })
      | null;

  describe("Devices tile", () => {
    it("does not render when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      await mount();

      expect(element.shadowRoot?.querySelector(".device-action")).toBeNull();
      expect(devicesTile()).toBeNull();
    });

    it("renders with the 'Devices' label when Web Bluetooth is supported", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      const tile = devicesTile();
      expect(tile).not.toBeNull();
      expect(tile?.label).toBe("Devices");
    });

    it("opens the device connect sheet when activated", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      expect(deviceConnectSheetOpenSignal.value).toBe(false);

      devicesTile()?.dispatchEvent(
        new CustomEvent("tile-click", { bubbles: true, composed: true }),
      );

      expect(deviceConnectSheetOpenSignal.value).toBe(true);
    });
  });
});
