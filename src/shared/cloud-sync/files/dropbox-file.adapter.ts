import type {
  ICloudFileAdapter,
  ICloudProviderConnection,
  ICloudProviderTokens,
  ISyncEnvelope,
} from "../../interfaces/cloud-sync.interface";
import { dropboxAuthAdapter } from "../auth/dropbox-auth.adapter";

/** Path inside the app's sandboxed Dropbox App Folder - no leading-segment prefix needed, Dropbox scopes an "App folder" app to its own folder automatically. */
const SYNC_FILE_PATH = "/brew-me-sync.json";
const DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";

interface IDropboxApiError {
  error_summary?: string;
  error?: { ".tag"?: string; path?: { ".tag"?: string } };
}

const buildApiArgHeader = (arg: Record<string, unknown>): string => JSON.stringify(arg);

const parseDropboxError = async (response: Response): Promise<IDropboxApiError | null> => {
  try {
    return (await response.json()) as IDropboxApiError;
  } catch {
    return null;
  }
};

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
    throw new Error("Dropbox session expired - please reconnect.");
  }

  try {
    return await dropboxAuthAdapter.refreshTokens(refreshToken);
  } catch {
    throw new Error("Dropbox session expired - please reconnect.");
  }
};

const fetchDownload = (accessToken: string): Promise<Response> =>
  fetch(DOWNLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": buildApiArgHeader({ path: SYNC_FILE_PATH }),
    },
  });

const readSyncFile: ICloudFileAdapter["readSyncFile"] = async (connection) => {
  let response = await fetchDownload(connection.tokens.accessToken);
  let refreshedTokens: ICloudProviderTokens | undefined;

  if (response.status === 401) {
    refreshedTokens = await reauth(connection);
    response = await fetchDownload(refreshedTokens.accessToken);
    if (response.status === 401) {
      throw new Error("Dropbox session expired - please reconnect.");
    }
  }

  if (response.status === 409) {
    const error = await parseDropboxError(response);
    const tag = error?.error?.[".tag"];
    const pathTag = error?.error?.path?.[".tag"];
    if (tag === "path" && pathTag === "not_found") {
      // No sync file yet - a brand-new connection, not an error.
      return null;
    }
    throw new Error(error?.error_summary ?? "Dropbox download failed.");
  }

  if (!response.ok) {
    throw new Error(`Dropbox download failed (${response.status}).`);
  }

  // Dropbox's `files/download` returns the file's raw bytes as the response
  // body - file metadata (including `rev`) rides along in the
  // `Dropbox-API-Result` header as a separate JSON blob instead.
  let revision: string | undefined;
  const resultHeader = response.headers.get("dropbox-api-result");
  if (resultHeader) {
    try {
      revision = (JSON.parse(resultHeader) as { rev?: string }).rev;
    } catch {
      revision = undefined;
    }
  }

  const text = await response.text();
  const envelope = JSON.parse(text) as ISyncEnvelope;

  return { envelope, revision, tokens: refreshedTokens };
};

const fetchUpload = (
  accessToken: string,
  connection: ICloudProviderConnection,
  envelope: ISyncEnvelope,
): Promise<Response> => {
  const mode = connection.lastKnownRevision
    ? { ".tag": "update", update: connection.lastKnownRevision }
    : { ".tag": "add" };

  return fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": buildApiArgHeader({ path: SYNC_FILE_PATH, mode, mute: true }),
      "Content-Type": "application/octet-stream",
    },
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
      throw new Error("Dropbox session expired - please reconnect.");
    }
  }

  if (!response.ok) {
    const error = await parseDropboxError(response);
    throw new Error(error?.error_summary ?? `Dropbox upload failed (${response.status}).`);
  }

  const result = (await response.json()) as { rev?: string };
  return { revision: result.rev, tokens: refreshedTokens };
};

export const dropboxFileAdapter: ICloudFileAdapter = {
  providerId: "dropbox",
  readSyncFile,
  writeSyncFile,
};
