import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  monitorConnectionStateSignal,
  scaleConnectionStateSignal,
} from "../../../shared/stores/device-connection.store";
import { deviceConnectSheetOpenSignal } from "../../../shared/stores/device-connect-sheet.store";
import "../brew-top-bar";
import type { TopBar } from "../TopBar";

describe("brew-top-bar", () => {
  let element: TopBar;

  beforeEach(async () => {
    element = document.createElement("brew-top-bar") as TopBar;
    element.title = "Timer";
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the title", () => {
    expect(element.shadowRoot?.querySelector(".title")?.textContent).toBe("Timer");
  });

  it("has an empty trailing slot by default", () => {
    const slot = element.shadowRoot?.querySelector('slot[name="trailing"]') as HTMLSlotElement;
    expect(slot).not.toBeNull();
    expect(slot.assignedNodes()).toHaveLength(0);
  });

  it("projects light-DOM children marked slot=trailing into the trailing slot", async () => {
    const badge = document.createElement("span");
    badge.setAttribute("slot", "trailing");
    badge.textContent = "●";
    element.appendChild(badge);
    await element.updateComplete;

    const slot = element.shadowRoot?.querySelector('slot[name="trailing"]') as HTMLSlotElement;
    expect(slot.assignedNodes()).toContain(badge);
  });

  describe("device-status control", () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "bluetooth");
      scaleConnectionStateSignal.value = "disconnected";
      monitorConnectionStateSignal.value = "disconnected";
      deviceConnectSheetOpenSignal.value = false;
    });

    it("renders nothing when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      element.requestUpdate();
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".device-status")).toBeNull();
    });

    it("shows the bluetooth icon and a 'connect' aria-label when supported but nothing is connected", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      element.requestUpdate();
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(".device-status");
      expect(button).not.toBeNull();
      expect(button?.getAttribute("aria-label")).toBe("Connect your devices");
      expect(button?.querySelectorAll("brew-icon")).toHaveLength(1);
    });

    it("shows only the scale icon and a scale-connected aria-label when just the scale is connected", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      scaleConnectionStateSignal.value = "connected";
      element.requestUpdate();
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(".device-status");
      expect(button?.getAttribute("aria-label")).toBe(
        "Bookoo Scale connected. Manage connected devices.",
      );
      expect(button?.querySelectorAll("brew-icon")).toHaveLength(1);
    });

    it("shows only the monitor icon and a monitor-connected aria-label when just the monitor is connected", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      monitorConnectionStateSignal.value = "connected";
      element.requestUpdate();
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(".device-status");
      expect(button?.getAttribute("aria-label")).toBe(
        "Espresso Monitor connected. Manage connected devices.",
      );
      expect(button?.querySelectorAll("brew-icon")).toHaveLength(1);
    });

    it("shows both icons and a combined aria-label when both devices are connected", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      scaleConnectionStateSignal.value = "connected";
      monitorConnectionStateSignal.value = "connected";
      element.requestUpdate();
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(".device-status");
      expect(button?.getAttribute("aria-label")).toBe(
        "Bookoo Scale and Espresso Monitor connected. Manage connected devices.",
      );
      expect(button?.querySelectorAll("brew-icon")).toHaveLength(2);
    });

    it("opens the device connect sheet when clicked", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      element.requestUpdate();
      await element.updateComplete;

      expect(deviceConnectSheetOpenSignal.value).toBe(false);

      const button = element.shadowRoot?.querySelector(".device-status") as HTMLButtonElement;
      button.click();

      expect(deviceConnectSheetOpenSignal.value).toBe(true);
    });
  });
});
