import { DeviceConnectAction } from "./DeviceConnectAction";

if (!customElements.get("brew-device-connect-action")) {
  customElements.define("brew-device-connect-action", DeviceConnectAction);
}
