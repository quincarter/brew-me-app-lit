import type { ISavedBrew } from "./brew.interface";
import type { IBrewShot } from "./shot.interface";

/** The three cloud providers a person can connect for automatic background sync. */
export type CloudProviderId = "dropbox" | "onedrive" | "google-drive";

/** OAuth PKCE tokens for one connected provider. `refreshToken` is absent only if a provider issued none (shouldn't happen for the offline-access scopes we request, but kept optional defensively). */
export interface ICloudProviderTokens {
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms when `accessToken` expires. */
  expiresAt: number;
  scope: string;
  obtainedAt: number;
}

/** A person's connection to one provider, including enough remote-file bookkeeping for conditional writes. */
export interface ICloudProviderConnection {
  providerId: CloudProviderId;
  /** Display name/email, when the provider's profile endpoint made it cheap to fetch at connect time. */
  accountLabel?: string;
  tokens: ICloudProviderTokens;
  connectedAt: number;
  /** Google Drive only - appData files are addressed by id, not a fixed path like Dropbox/OneDrive's app folder. */
  remoteFileId?: string;
  /** Dropbox `rev` / Microsoft Graph `eTag` from the last successful write - used for conditional writes so two racing writers don't clobber each other. */
  lastKnownRevision?: string;
}

/** Marks a saved brew as deleted locally so a pull from a provider that still has it doesn't resurrect it. */
export interface ISyncTombstone {
  id: number;
  deletedAt: number;
}

/** The JSON shape written to/read from the provider's sandboxed sync file. */
export interface ISyncEnvelope {
  schemaVersion: 1;
  /** Random id generated once per install - used only for deterministic tie-breaking on simultaneous `updatedAt` values, not identity. */
  deviceId: string;
  savedAt: number;
  savedBrews: ISavedBrew[];
  /** Scale-captured brew curves (weight/flow telemetry), one per completed session - see `IBrewShot`. Append-only: nothing in the app ever edits or deletes a shot once sealed, so unlike `savedBrews` these don't need `updatedAt`/tombstone handling, just a union-by-id merge. */
  savedShots: IBrewShot[];
  customBrewTypes: string[];
  customStepLabels: string[];
  tombstones: ISyncTombstone[];
}

export interface IProviderSyncStatus {
  status: "idle" | "syncing" | "error";
  lastSyncedAt?: number;
  lastError?: string;
}

/** Persisted cloud-sync state - one active provider at a time (connecting a new one replaces the current connection). */
export interface ICloudSyncState {
  activeProviderId: CloudProviderId | null;
  connections: Partial<Record<CloudProviderId, ICloudProviderConnection>>;
  statuses: Partial<Record<CloudProviderId, IProviderSyncStatus>>;
}

/** Survives the full-navigation OAuth redirect round trip via `sessionStorage` (not a `persistentSignal` - see `cloud-sync.store.ts`'s `getPendingAuthAttempt`/`setPendingAuthAttempt` for why) and is matched back to the initiating provider by `state`. */
export interface IPendingAuthAttempt {
  providerId: CloudProviderId;
  codeVerifier: string;
  state: string;
  createdAt: number;
}

/** One provider's PKCE auth adapter: builds the authorization URL and exchanges/refreshes tokens without ever needing a client secret. */
export interface ICloudAuthAdapter {
  providerId: CloudProviderId;
  buildAuthorizationUrl(codeChallenge: string, state: string): string;
  exchangeCodeForTokens(code: string, codeVerifier: string): Promise<ICloudProviderTokens>;
  refreshTokens(refreshToken: string): Promise<ICloudProviderTokens>;
}

/** One provider's sandboxed-folder file adapter for reading/writing the sync envelope. Either method may return `tokens` when a mid-flight 401 forced a reactive refresh, so the caller persists the refreshed token instead of discarding it. */
export interface ICloudFileAdapter {
  providerId: CloudProviderId;
  readSyncFile(connection: ICloudProviderConnection): Promise<{
    envelope: ISyncEnvelope;
    revision?: string;
    remoteFileId?: string;
    tokens?: ICloudProviderTokens;
  } | null>;
  writeSyncFile(
    connection: ICloudProviderConnection,
    envelope: ISyncEnvelope,
  ): Promise<{ revision?: string; remoteFileId?: string; tokens?: ICloudProviderTokens }>;
}
