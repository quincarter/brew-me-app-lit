import type {
  CloudProviderId,
  ICloudAuthAdapter,
  ICloudFileAdapter,
  ICloudProviderTokens,
} from "../interfaces/cloud-sync.interface";
import { dropboxAuthAdapter } from "./auth/dropbox-auth.adapter";
import { googleAuthAdapter } from "./auth/google-auth.adapter";
import { microsoftAuthAdapter } from "./auth/microsoft-auth.adapter";
import { dropboxFileAdapter } from "./files/dropbox-file.adapter";
import { googleDriveFileAdapter } from "./files/google-drive-file.adapter";
import { microsoftFileAdapter } from "./files/microsoft-file.adapter";
import { runSync } from "./sync-engine";
import type {
  IConnectRequestMessage,
  IDisconnectRequestMessage,
  ISyncNowRequestMessage,
  SyncWorkerRequestMessage,
  SyncWorkerResponseMessage,
} from "./worker-messages";

/**
 * Shadows the ambient `Window.postMessage` (from the shared tsconfig's
 * `"DOM"` lib - this repo has one tsconfig for the whole app, so adding
 * `"webworker"` to `lib` here would conflict with `self`/`postMessage`'s DOM
 * typings everywhere else in `src`) with the single-argument signature this
 * file actually runs under at runtime: a dedicated Worker's global scope.
 */
declare function postMessage(message: SyncWorkerResponseMessage): void;

/** All three providers are wired up as of Phase 2 - adding a fourth would only mean a new adapter pair plus an entry here, no message-contract changes. */
const AUTH_ADAPTERS: Partial<Record<CloudProviderId, ICloudAuthAdapter>> = {
  dropbox: dropboxAuthAdapter,
  onedrive: microsoftAuthAdapter,
  "google-drive": googleAuthAdapter,
};
const FILE_ADAPTERS: Partial<Record<CloudProviderId, ICloudFileAdapter>> = {
  dropbox: dropboxFileAdapter,
  onedrive: microsoftFileAdapter,
  "google-drive": googleDriveFileAdapter,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const handleConnect = async (message: IConnectRequestMessage): Promise<void> => {
  const authAdapter = AUTH_ADAPTERS[message.providerId];
  if (!authAdapter) {
    postMessage({
      type: "sync-error",
      requestId: message.requestId,
      providerId: message.providerId,
      message: `No auth adapter registered for "${message.providerId}" yet.`,
    });
    return;
  }

  try {
    const tokens: ICloudProviderTokens = await authAdapter.exchangeCodeForTokens(
      message.code,
      message.codeVerifier,
    );

    postMessage({
      type: "connected",
      requestId: message.requestId,
      providerId: message.providerId,
      connection: {
        providerId: message.providerId,
        tokens,
        connectedAt: Date.now(),
      },
    });
  } catch (error) {
    postMessage({
      type: "sync-error",
      requestId: message.requestId,
      providerId: message.providerId,
      message: errorMessage(error, "Failed to connect."),
    });
  }
};

const handleSyncNow = async (message: ISyncNowRequestMessage): Promise<void> => {
  const authAdapter = AUTH_ADAPTERS[message.providerId];
  const fileAdapter = FILE_ADAPTERS[message.providerId];
  if (!authAdapter || !fileAdapter) {
    postMessage({
      type: "sync-error",
      requestId: message.requestId,
      providerId: message.providerId,
      message: `No adapters registered for "${message.providerId}" yet.`,
    });
    return;
  }

  try {
    const result = await runSync({
      fileAdapter,
      authAdapter,
      connection: message.connection,
      localState: message.localState,
      deviceId: message.deviceId,
    });

    postMessage({
      type: "sync-result",
      requestId: message.requestId,
      providerId: message.providerId,
      mergedState: result.mergedState,
      connection: result.connection,
      status: result.status,
    });
  } catch (error) {
    postMessage({
      type: "sync-error",
      requestId: message.requestId,
      providerId: message.providerId,
      message: errorMessage(error, "Sync failed."),
    });
  }
};

/**
 * No token-revocation call yet in Phase 1 - just acknowledges so the main
 * thread can drop its local connection state. A real revocation `fetch`
 * (Dropbox's `/2/auth/token/revoke`) can be added here later without
 * changing the message contract.
 */
const handleDisconnect = (message: IDisconnectRequestMessage): void => {
  postMessage({
    type: "disconnected",
    requestId: message.requestId,
    providerId: message.providerId,
  });
};

addEventListener("message", (event: MessageEvent) => {
  const message = event.data as SyncWorkerRequestMessage;

  if (message.type === "connect") {
    void handleConnect(message);
  } else if (message.type === "sync-now") {
    void handleSyncNow(message);
  } else if (message.type === "disconnect") {
    handleDisconnect(message);
  }
});
