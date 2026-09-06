import type {
  ICloudFileAdapter,
  ICloudProviderConnection,
  ICloudProviderTokens,
  ISyncEnvelope,
} from "../../interfaces/cloud-sync.interface";
import { microsoftAuthAdapter } from "../auth/microsoft-auth.adapter";

/** The app's sandboxed "App Root" special folder - Graph scopes `Files.ReadWrite.AppFolder` to just this folder automatically, same sandboxing idea as Dropbox's App Folder. */
const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const CONTENT_URL = `${GRAPH_BASE_URL}/me/drive/special/approot:/brew-me-sync.json:/content`;
const METADATA_URL = `${GRAPH_BASE_URL}/me/drive/special/approot:/brew-me-sync.json`;

/**
 * Refreshes the access token and reports the full refreshed token set back
 * to the caller, so a mid-flight 401 also updates the connection the caller
 * ends up persisting - not just the retried request. Throws a clear
 * "reconnect required" error if there's no refresh token or the refresh
 * itself fails.
 */
const reauth = async (connection: ICloudProviderConnection): Promise<ICloudProviderTokens> => {
  const refreshToken = connection.tokens.refreshToken;
  if (!refreshToken) {
    throw new Error("OneDrive session expired - please reconnect.");
  }

  try {
    return await microsoftAuthAdapter.refreshTokens(refreshToken);
  } catch {
    throw new Error("OneDrive session expired - please reconnect.");
  }
};

const fetchContent = (accessToken: string): Promise<Response> =>
  fetch(CONTENT_URL, { headers: { Authorization: `Bearer ${accessToken}` } });

const fetchMetadata = (accessToken: string): Promise<Response> =>
  fetch(METADATA_URL, { headers: { Authorization: `Bearer ${accessToken}` } });

const readSyncFile: ICloudFileAdapter["readSyncFile"] = async (connection) => {
  let response = await fetchContent(connection.tokens.accessToken);
  let refreshedTokens: ICloudProviderTokens | undefined;

  if (response.status === 401) {
    refreshedTokens = await reauth(connection);
    response = await fetchContent(refreshedTokens.accessToken);
    if (response.status === 401) {
      throw new Error("OneDrive session expired - please reconnect.");
    }
  }

  if (response.status === 404) {
    // No sync file yet - a brand-new connection, not an error.
    return null;
  }

  if (!response.ok) {
    throw new Error(`OneDrive download failed (${response.status}).`);
  }

  const envelope = (await response.json()) as ISyncEnvelope;

  // Graph doesn't return file metadata (the `eTag` a conditional write needs)
  // on a `:/content` GET - a second, metadata-only request picks it up.
  // Best-effort: a failure here shouldn't fail the whole read, it just means
  // the next write can't send `If-Match`.
  let revision: string | undefined;
  try {
    const metadataResponse = await fetchMetadata(
      refreshedTokens?.accessToken ?? connection.tokens.accessToken,
    );
    if (metadataResponse.ok) {
      const metadata = (await metadataResponse.json()) as { eTag?: string };
      revision = metadata.eTag;
    }
  } catch {
    revision = undefined;
  }

  return { envelope, revision, tokens: refreshedTokens };
};

const fetchUpload = (
  accessToken: string,
  connection: ICloudProviderConnection,
  envelope: ISyncEnvelope,
): Promise<Response> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  if (connection.lastKnownRevision) {
    // Conditional write, mirroring Dropbox's `mode: update` with `rev`.
    headers["If-Match"] = connection.lastKnownRevision;
  }

  return fetch(CONTENT_URL, {
    method: "PUT",
    headers,
    body: JSON.stringify(envelope),
  });
};

const writeSyncFile: ICloudFileAdapter["writeSyncFile"] = async (connection, envelope) => {
  let response = await fetchUpload(connection.tokens.accessToken, connection, envelope);
  let refreshedTokens: ICloudProviderTokens | undefined;

  if (response.status === 401) {
    refreshedTokens = await reauth(connection);
    response = await fetchUpload(refreshedTokens.accessToken, connection, envelope);
    if (response.status === 401) {
      throw new Error("OneDrive session expired - please reconnect.");
    }
  }

  if (!response.ok) {
    throw new Error(`OneDrive upload failed (${response.status}).`);
  }

  const result = (await response.json()) as { eTag?: string };
  return { revision: result.eTag, tokens: refreshedTokens };
};

export const microsoftFileAdapter: ICloudFileAdapter = {
  providerId: "onedrive",
  readSyncFile,
  writeSyncFile,
};
