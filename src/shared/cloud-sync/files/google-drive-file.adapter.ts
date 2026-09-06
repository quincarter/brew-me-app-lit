import type {
  ICloudFileAdapter,
  ICloudProviderConnection,
  ICloudProviderTokens,
  ISyncEnvelope,
} from "../../interfaces/cloud-sync.interface";
import { googleAuthAdapter } from "../auth/google-auth.adapter";

/** Hidden `appDataFolder` space - invisible in the person's regular Drive UI, only this app can see/write to it. */
const DRIVE_BASE_URL = "https://www.googleapis.com/drive/v3";
const UPLOAD_BASE_URL = "https://www.googleapis.com/upload/drive/v3";
const SYNC_FILE_NAME = "brew-me-sync.json";
const MULTIPART_BOUNDARY = "brew-me-sync-envelope";

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
    throw new Error("Google Drive session expired - please reconnect.");
  }

  try {
    return await googleAuthAdapter.refreshTokens(refreshToken);
  } catch {
    throw new Error("Google Drive session expired - please reconnect.");
  }
};

const withAuth = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
});

const buildListUrl = (): string => {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name='${SYNC_FILE_NAME}'`,
    fields: "files(id)",
  });
  return `${DRIVE_BASE_URL}/files?${params.toString()}`;
};

const fetchList = (accessToken: string): Promise<Response> =>
  fetch(buildListUrl(), { headers: withAuth(accessToken) });

const fetchContent = (accessToken: string, fileId: string): Promise<Response> =>
  fetch(`${DRIVE_BASE_URL}/files/${fileId}?alt=media`, { headers: withAuth(accessToken) });

const readSyncFile: ICloudFileAdapter["readSyncFile"] = async (connection) => {
  let refreshedTokens: ICloudProviderTokens | undefined;
  let fileId = connection.remoteFileId;

  if (!fileId) {
    let listResponse = await fetchList(connection.tokens.accessToken);
    if (listResponse.status === 401) {
      refreshedTokens = await reauth(connection);
      listResponse = await fetchList(refreshedTokens.accessToken);
      if (listResponse.status === 401) {
        throw new Error("Google Drive session expired - please reconnect.");
      }
    }
    if (!listResponse.ok) {
      throw new Error(`Google Drive lookup failed (${listResponse.status}).`);
    }

    const listResult = (await listResponse.json()) as { files?: { id: string }[] };
    fileId = listResult.files?.[0]?.id;
    if (!fileId) {
      // No sync file yet - a brand-new connection, not an error. Not created
      // here - only a write creates it.
      return null;
    }
  }

  const accessTokenForContent = refreshedTokens?.accessToken ?? connection.tokens.accessToken;
  let contentResponse = await fetchContent(accessTokenForContent, fileId);
  if (contentResponse.status === 401) {
    refreshedTokens = await reauth(connection);
    contentResponse = await fetchContent(refreshedTokens.accessToken, fileId);
    if (contentResponse.status === 401) {
      throw new Error("Google Drive session expired - please reconnect.");
    }
  }

  if (contentResponse.status === 404) {
    return null;
  }
  if (!contentResponse.ok) {
    throw new Error(`Google Drive download failed (${contentResponse.status}).`);
  }

  const envelope = (await contentResponse.json()) as ISyncEnvelope;
  return { envelope, remoteFileId: fileId, tokens: refreshedTokens };
};

/** Standard `multipart/related` body for Drive API v3's multipart upload: one JSON metadata part, one JSON content part. */
const buildCreateMultipartBody = (
  envelope: ISyncEnvelope,
): { body: string; contentType: string } => {
  const metadata = JSON.stringify({ name: SYNC_FILE_NAME, parents: ["appDataFolder"] });
  const envelopeJson = JSON.stringify(envelope);
  const body = [
    `--${MULTIPART_BOUNDARY}`,
    "Content-Type: application/json",
    "",
    metadata,
    `--${MULTIPART_BOUNDARY}`,
    "Content-Type: application/json",
    "",
    envelopeJson,
    `--${MULTIPART_BOUNDARY}--`,
  ].join("\r\n");

  return { body, contentType: `multipart/related; boundary=${MULTIPART_BOUNDARY}` };
};

const fetchCreate = (accessToken: string, envelope: ISyncEnvelope): Promise<Response> => {
  const { body, contentType } = buildCreateMultipartBody(envelope);
  return fetch(`${UPLOAD_BASE_URL}/files?uploadType=multipart`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
    body,
  });
};

/** Media-only update - just the content changes, not metadata, so no multipart body is needed. */
const fetchUpdate = (
  accessToken: string,
  fileId: string,
  envelope: ISyncEnvelope,
): Promise<Response> =>
  fetch(`${UPLOAD_BASE_URL}/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  });

/**
 * No clean conditional-write primitive exists for appData files (unlike
 * Dropbox's `rev`/Graph's `eTag`) - accepted as a small optimistic-write
 * race for v1 (single low-frequency file, effectively single active
 * writer), so `revision` is never populated in this adapter's results.
 */
const writeSyncFile: ICloudFileAdapter["writeSyncFile"] = async (connection, envelope) => {
  const fileId = connection.remoteFileId;
  const doWrite = (accessToken: string): Promise<Response> =>
    fileId ? fetchUpdate(accessToken, fileId, envelope) : fetchCreate(accessToken, envelope);

  let response = await doWrite(connection.tokens.accessToken);
  let refreshedTokens: ICloudProviderTokens | undefined;

  if (response.status === 401) {
    refreshedTokens = await reauth(connection);
    response = await doWrite(refreshedTokens.accessToken);
    if (response.status === 401) {
      throw new Error("Google Drive session expired - please reconnect.");
    }
  }

  // A cached remoteFileId goes stale if the file was deleted outside the
  // app (manually, or some other Drive cleanup) - a 404 on an update means
  // "that id no longer exists", not a real failure. Recreate the file fresh
  // rather than surfacing an opaque error that would otherwise repeat on
  // every sync from then on with no way to self-heal.
  let recreated = false;
  if (fileId && response.status === 404) {
    recreated = true;
    const accessTokenForCreate = refreshedTokens?.accessToken ?? connection.tokens.accessToken;
    response = await fetchCreate(accessTokenForCreate, envelope);
    if (response.status === 401) {
      refreshedTokens = await reauth(connection);
      response = await fetchCreate(refreshedTokens.accessToken, envelope);
      if (response.status === 401) {
        throw new Error("Google Drive session expired - please reconnect.");
      }
    }
  }

  if (!response.ok) {
    throw new Error(`Google Drive upload failed (${response.status}).`);
  }

  const result = (await response.json()) as { id?: string };
  return { remoteFileId: recreated ? result.id : (fileId ?? result.id), tokens: refreshedTokens };
};

export const googleDriveFileAdapter: ICloudFileAdapter = {
  providerId: "google-drive",
  readSyncFile,
  writeSyncFile,
};
