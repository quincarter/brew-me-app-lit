import { signal } from "@lit-labs/preact-signals";

export const deviceConnectSheetOpenSignal = signal(false);

export const openDeviceConnectSheet = (): void => {
  deviceConnectSheetOpenSignal.value = true;
};

export const closeDeviceConnectSheet = (): void => {
  deviceConnectSheetOpenSignal.value = false;
};
