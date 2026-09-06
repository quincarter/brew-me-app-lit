import type { CloudProviderId } from "../interfaces/cloud-sync.interface";

const CLOUD_PROVIDER_LABELS: Record<CloudProviderId, string> = {
  dropbox: "Dropbox",
  onedrive: "OneDrive",
  "google-drive": "Google Drive",
};

/** Display name for a cloud provider id - shared by `CloudSyncProviderRow` and Home's Cloud Sync tile so both stay in sync as providers are added. */
export const getCloudProviderLabel = (providerId: CloudProviderId): string =>
  CLOUD_PROVIDER_LABELS[providerId];
