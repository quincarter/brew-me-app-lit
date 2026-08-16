/** Web Bluetooth is desktop/Android Chromium only, and requires a secure context - no iOS Safari, no Firefox. */
export const isWebBluetoothSupported = (): boolean =>
  typeof navigator !== "undefined" && "bluetooth" in navigator;
