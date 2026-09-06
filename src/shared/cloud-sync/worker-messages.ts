import type {
  CloudProviderId,
  ICloudProviderConnection,
  IProviderSyncStatus,
} from "../interfaces/cloud-sync.interface";
import type { ICloudSyncLocalState } from "./sync-engine";

/**
 * The `sync.worker.ts` message contract - plain, structured-clone-safe data
 * only (no class instances, no `Signal`s) so it's identical whether the
 * worker is real or (in a test) a same-thread stand-in. Kept
 * provider-agnostic (a `providerId` field on every message) even though
 * only Dropbox is wired up in Phase 1, so Phase 2's OneDrive/Google Drive
 * adapters slot in without changing this contract. Every request/response
 * pair shares a `requestId` so `cloud-sync.store.ts` can match a worker
 * reply back to the promise that's awaiting it.
 */
export interface IConnectRequestMessage {
  type: "connect";
  requestId: string;
  providerId: CloudProviderId;
  code: string;
  codeVerifier: string;
  deviceId: string;
}

export interface ISyncNowRequestMessage {
  type: "sync-now";
  requestId: string;
  providerId: CloudProviderId;
  connection: ICloudProviderConnection;
  localState: ICloudSyncLocalState;
  deviceId: string;
}

export interface IDisconnectRequestMessage {
  type: "disconnect";
  requestId: string;
  providerId: CloudProviderId;
  connection: ICloudProviderConnection;
}

export type SyncWorkerRequestMessage =
  | IConnectRequestMessage
  | ISyncNowRequestMessage
  | IDisconnectRequestMessage;

export interface IConnectedResponseMessage {
  type: "connected";
  requestId: string;
  providerId: CloudProviderId;
  connection: ICloudProviderConnection;
}

export interface ISyncResultResponseMessage {
  type: "sync-result";
  requestId: string;
  providerId: CloudProviderId;
  mergedState: ICloudSyncLocalState;
  connection: ICloudProviderConnection;
  status: IProviderSyncStatus;
}

export interface ISyncErrorResponseMessage {
  type: "sync-error";
  requestId: string;
  providerId: CloudProviderId;
  message: string;
}

export interface IDisconnectedResponseMessage {
  type: "disconnected";
  requestId: string;
  providerId: CloudProviderId;
}

export type SyncWorkerResponseMessage =
  | IConnectedResponseMessage
  | ISyncResultResponseMessage
  | ISyncErrorResponseMessage
  | IDisconnectedResponseMessage;
