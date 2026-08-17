import { beforeEach, describe, expect, it } from "vitest";
import {
  closeDeviceConnectSheet,
  deviceConnectSheetOpenSignal,
  openDeviceConnectSheet,
} from "../device-connect-sheet.store";

describe("device-connect-sheet.store", () => {
  beforeEach(() => {
    deviceConnectSheetOpenSignal.value = false;
  });

  describe("openDeviceConnectSheet", () => {
    it("sets the open signal to true", () => {
      openDeviceConnectSheet();

      expect(deviceConnectSheetOpenSignal.value).toBe(true);
    });
  });

  describe("closeDeviceConnectSheet", () => {
    it("sets the open signal to false", () => {
      openDeviceConnectSheet();

      closeDeviceConnectSheet();

      expect(deviceConnectSheetOpenSignal.value).toBe(false);
    });
  });
});
