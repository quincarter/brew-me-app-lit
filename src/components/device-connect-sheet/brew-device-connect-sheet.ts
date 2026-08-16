import { DeviceConnectSheet } from "./DeviceConnectSheet";

if (!customElements.get("brew-device-connect-sheet")) {
  customElements.define("brew-device-connect-sheet", DeviceConnectSheet);
}
