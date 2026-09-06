import { CloudSyncProviderRow } from "./CloudSyncProviderRow";

if (!customElements.get("brew-cloud-sync-provider-row")) {
  customElements.define("brew-cloud-sync-provider-row", CloudSyncProviderRow);
}
