import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closeDeviceConnectSheet,
  deviceConnectSheetOpenSignal,
  openDeviceConnectSheet,
} from "../../../shared/stores/device-connect-sheet.store";
import "../brew-device-connect-sheet";
import type { DeviceConnectSheet } from "../DeviceConnectSheet";

describe("brew-device-connect-sheet", () => {
  let element: DeviceConnectSheet;

  beforeEach(async () => {
    deviceConnectSheetOpenSignal.value = false;

    element = document.createElement("brew-device-connect-sheet") as DeviceConnectSheet;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    deviceConnectSheetOpenSignal.value = false;
  });

  it("renders the bottom sheet closed by default", () => {
    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet).not.toBeNull();
    expect(sheet?.hasAttribute("open")).toBe(false);
  });

  it("opens the bottom sheet when deviceConnectSheetOpenSignal is set", async () => {
    openDeviceConnectSheet();
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet?.hasAttribute("open")).toBe(true);
  });

  it("closes when the signal flips back to false", async () => {
    openDeviceConnectSheet();
    await element.updateComplete;

    closeDeviceConnectSheet();
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet?.hasAttribute("open")).toBe(false);
  });

  it("calls closeDeviceConnectSheet when the bottom sheet's scrim is clicked", async () => {
    openDeviceConnectSheet();
    await element.updateComplete;
    expect(deviceConnectSheetOpenSignal.value).toBe(true);

    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    sheet?.dispatchEvent(new CustomEvent("sheet-scrim-click", { bubbles: true, composed: true }));
    await element.updateComplete;

    expect(deviceConnectSheetOpenSignal.value).toBe(false);
  });

  it("renders the device connect rows", () => {
    expect(element.shadowRoot?.querySelector("brew-device-connect-rows")).not.toBeNull();
  });
});
