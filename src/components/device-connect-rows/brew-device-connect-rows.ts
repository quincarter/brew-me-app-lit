import { DeviceConnectRows } from "./DeviceConnectRows";

if (!customElements.get("brew-device-connect-rows")) {
  customElements.define("brew-device-connect-rows", DeviceConnectRows);
}
