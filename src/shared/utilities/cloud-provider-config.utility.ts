import type { CloudProviderId } from "../interfaces/cloud-sync.interface";

const ALL_PROVIDER_IDS: CloudProviderId[] = ["dropbox", "onedrive", "google-drive"];

/**
 * Whether a provider's public PKCE client id is configured for this build.
 * Doubles as this feature's toggle: a provider with no client id set isn't
 * just broken if someone tries to connect it (the auth adapters already
 * throw a clear error for that) - it shouldn't be offered as an option at
 * all, so a person never sees functionality that was never wired up for
 * this deployment. Reads `import.meta.env` fresh on every call (not a
 * module-level constant) so it stays testable with `vi.stubEnv` without
 * needing `vi.resetModules()`, matching the same pattern each auth
 * adapter's own `getClientId()` already uses.
 */
export const isCloudProviderConfigured = (providerId: CloudProviderId): boolean => {
  const clientIdByProvider: Record<CloudProviderId, string | undefined> = {
    dropbox: import.meta.env.VITE_DROPBOX_CLIENT_ID,
    onedrive: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    "google-drive": import.meta.env.VITE_GOOGLE_CLIENT_ID,
  };
  return Boolean(clientIdByProvider[providerId]);
};

/** Every provider with a configured client id, in the app's fixed display order. */
export const getConfiguredCloudProviders = (): CloudProviderId[] =>
  ALL_PROVIDER_IDS.filter(isCloudProviderConfigured);

/** Whether at least one provider is configured - gates the feature's entry points (Home's tile, the Settings link) entirely when nothing is usable yet. */
export const isAnyCloudProviderConfigured = (): boolean => getConfiguredCloudProviders().length > 0;
