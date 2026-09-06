import { effect, signal } from "@lit-labs/preact-signals";
import type {
  CloudProviderId,
  ICloudAuthAdapter,
  ICloudProviderConnection,
  ICloudSyncState,
  IPendingAuthAttempt,
  IProviderSyncStatus,
} from "../interfaces/cloud-sync.interface";
import { dropboxAuthAdapter } from "../cloud-sync/auth/dropbox-auth.adapter";
import { googleAuthAdapter } from "../cloud-sync/auth/google-auth.adapter";
import { microsoftAuthAdapter } from "../cloud-sync/auth/microsoft-auth.adapter";
import type { ICloudSyncLocalState } from "../cloud-sync/sync-engine";
import type {
  SyncWorkerRequestMessage,
  SyncWorkerResponseMessage,
} from "../cloud-sync/worker-messages";
import { onReconnect } from "../utilities/connectivity.utility";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "../utilities/pkce.utility";
import { customBrewTypesSignal } from "./brew-types.store";
import { savedBrewsSignal } from "./brew.store";
import { customStepLabelsSignal } from "./custom-step-labels.store";
import { persistentSignal } from "./persistent-signal";
import { savedShotsSignal } from "./shot.store";
import { syncTombstonesSignal } from "./sync-tombstones.store";

/** How long after the last local edit the debounced push effect waits before syncing, coalescing bursts of edits into one push. */
const PUSH_DEBOUNCE_MS = 4000;

/** The store only ever calls `buildAuthorizationUrl` on these - the exchange/refresh methods stay worker-only (see `sync.worker.ts`'s own, separately-registered `AUTH_ADAPTERS` map). */
const AUTH_ADAPTERS: Partial<Record<CloudProviderId, ICloudAuthAdapter>> = {
  dropbox: dropboxAuthAdapter,
  onedrive: microsoftAuthAdapter,
  "google-drive": googleAuthAdapter,
};

export const cloudSyncStateSignal = persistentSignal<ICloudSyncState>(
  { activeProviderId: null, connections: {}, statuses: {} },
  { key: "cloud-sync-state" },
);

/** Random id generated once per install, used only for deterministic LWW tie-breaking - see `sync-engine.ts`'s `mergeSyncState`. */
const deviceIdSignal = persistentSignal<string>("", { key: "cloud-sync-device-id" });

const PENDING_AUTH_STORAGE_KEY = "cloud-sync-pending-auth";

/**
 * The pending PKCE attempt only needs to survive one same-tab redirect round
 * trip to the provider and back - never a fresh app launch - so it's kept in
 * `sessionStorage`, not a `persistentSignal`. That's a deliberate fix, not
 * just a style choice: `persistentSignal`'s IndexedDB load is asynchronous,
 * and `oauth-callback-page` reads this immediately on mount, right after the
 * *fresh full-page load* the redirect itself causes - a one-time imperative
 * read like that can easily run before the async load resolves, seeing the
 * default `null` instead of the value just written before navigating away
 * (unlike `cloudSyncStateSignal` above, which is only ever read reactively
 * inside `effect()`s that naturally re-fire once the real value loads in).
 * `sessionStorage` reads/writes are synchronous, so there's no load to race.
 */
const getPendingAuthAttempt = (): IPendingAuthAttempt | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IPendingAuthAttempt) : null;
  } catch {
    return null;
  }
};

const setPendingAuthAttempt = (attempt: IPendingAuthAttempt | null): void => {
  try {
    if (attempt) {
      sessionStorage.setItem(PENDING_AUTH_STORAGE_KEY, JSON.stringify(attempt));
    } else {
      sessionStorage.removeItem(PENDING_AUTH_STORAGE_KEY);
    }
  } catch {
    // sessionStorage can throw in rare environments (private-mode storage
    // caps, etc.) - the pending attempt just won't survive the redirect
    // round trip there, surfaced as the same "no matching attempt" error a
    // person sees if they take too long at the provider's login page.
  }
};

/**
 * Set for the duration of `applyMergedSyncState` writing a remote merge back
 * into the local signal stores. The debounced-push `effect()` below reads
 * this via `.peek()` (not `.value`) so it's consulted as a guard without
 * ever becoming a dependency itself - toggling this flag back off never
 * re-triggers that effect, only a genuine change to the synced data does.
 */
export const isApplyingRemoteSyncSignal = signal(false);

/** Returns this install's device id, generating and persisting one the first time it's needed. */
export const getDeviceId = (): string => {
  if (!deviceIdSignal.value) {
    deviceIdSignal.value = crypto.randomUUID();
  }
  return deviceIdSignal.value;
};

let worker: Worker | null = null;
let workerDisabledReason: string | null = null;
let requestCounter = 0;
const nextRequestId = (): string => `cloud-sync-${Date.now()}-${requestCounter++}`;

type PendingResolver = (message: SyncWorkerResponseMessage) => void;
const pendingRequests = new Map<string, PendingResolver>();

const setStatus = (providerId: CloudProviderId, status: IProviderSyncStatus): void => {
  cloudSyncStateSignal.value = {
    ...cloudSyncStateSignal.value,
    statuses: { ...cloudSyncStateSignal.value.statuses, [providerId]: status },
  };
};

const setConnection = (
  providerId: CloudProviderId,
  connection: ICloudProviderConnection | undefined,
): void => {
  const nextConnections = { ...cloudSyncStateSignal.value.connections };
  if (connection) {
    nextConnections[providerId] = connection;
  } else {
    delete nextConnections[providerId];
  }
  cloudSyncStateSignal.value = { ...cloudSyncStateSignal.value, connections: nextConnections };
};

/**
 * Lazily instantiates the sync worker exactly once. Falls back gracefully
 * if `Worker` construction ever throws (e.g. an unusual embedded webview) -
 * caught here so a rare environment quirk disables sync with a clear status
 * instead of crashing the app.
 */
const getWorker = (): Worker | null => {
  if (worker || workerDisabledReason) return worker;

  try {
    const created = new Worker(new URL("../cloud-sync/sync.worker.ts", import.meta.url), {
      type: "module",
    });
    created.addEventListener("message", (event: MessageEvent<SyncWorkerResponseMessage>) => {
      const response = event.data;
      const resolve = pendingRequests.get(response.requestId);
      if (!resolve) return;
      pendingRequests.delete(response.requestId);
      resolve(response);
    });
    worker = created;
  } catch (error) {
    workerDisabledReason =
      error instanceof Error ? error.message : "Cloud sync is unavailable in this environment.";
    console.error("Failed to start the cloud-sync worker:", error);

    const activeProviderId = cloudSyncStateSignal.value.activeProviderId;
    if (activeProviderId) {
      setStatus(activeProviderId, { status: "error", lastError: workerDisabledReason });
    }
  }

  return worker;
};

const postToWorker = (message: SyncWorkerRequestMessage): Promise<SyncWorkerResponseMessage> => {
  const activeWorker = getWorker();
  if (!activeWorker) {
    return Promise.reject(
      new Error(workerDisabledReason ?? "Cloud sync is unavailable in this environment."),
    );
  }

  return new Promise((resolve) => {
    pendingRequests.set(message.requestId, resolve);
    activeWorker.postMessage(message);
  });
};

/**
 * Kicks off a provider's PKCE flow: generates a verifier/challenge/state,
 * persists the pending attempt (keyed by `state`, so it survives the
 * full-navigation redirect), then navigates the browser to the provider's
 * authorization page. Same-tab full navigation, not a popup - simpler and
 * reliable inside an installed PWA's standalone display mode.
 */
export const connectProvider = async (providerId: CloudProviderId): Promise<void> => {
  const authAdapter = AUTH_ADAPTERS[providerId];
  if (!authAdapter) {
    throw new Error(`No auth adapter registered for "${providerId}" yet.`);
  }

  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();
    const authorizationUrl = authAdapter.buildAuthorizationUrl(codeChallenge, state);

    setPendingAuthAttempt({
      providerId,
      codeVerifier,
      state,
      createdAt: Date.now(),
    });

    window.location.href = authorizationUrl;
  } catch (error) {
    setStatus(providerId, {
      status: "error",
      lastError:
        error instanceof Error
          ? error.message
          : `Couldn't connect to ${providerId}. Please try again.`,
    });
    throw error;
  }
};

/**
 * Called by `oauth-callback-page` once a provider redirects back with
 * `code`/`state`. The provider itself is determined by the pending
 * attempt's own `providerId` - not assumed - since the callback page is
 * fully provider-agnostic and never knows which provider actually matched
 * until this resolves. Matches `state` against the pending attempt, hands
 * the code exchange off to the worker, persists the resulting connection as
 * the active provider (replacing any other connected provider - only one is
 * active at a time), then clears the pending attempt either way.
 */
export const completeProviderConnect = async (code: string, state: string): Promise<void> => {
  const pending = getPendingAuthAttempt();
  if (!pending || pending.state !== state) {
    throw new Error("No matching connection attempt found - please try connecting again.");
  }

  const providerId = pending.providerId;
  setStatus(providerId, { status: "syncing" });

  try {
    const response = await postToWorker({
      type: "connect",
      requestId: nextRequestId(),
      providerId,
      code,
      codeVerifier: pending.codeVerifier,
      deviceId: getDeviceId(),
    });

    if (response.type === "sync-error") {
      throw new Error(response.message);
    }
    if (response.type !== "connected") {
      throw new Error("Unexpected response connecting to the provider.");
    }

    setConnection(providerId, response.connection);
    cloudSyncStateSignal.value = { ...cloudSyncStateSignal.value, activeProviderId: providerId };
    setStatus(providerId, { status: "idle" });
  } catch (error) {
    setStatus(providerId, {
      status: "error",
      lastError: error instanceof Error ? error.message : "Failed to connect.",
    });
    throw error;
  } finally {
    setPendingAuthAttempt(null);
  }
};

/** Drops a provider's connection and status locally (best-effort worker notify first, for any future token-revocation call). Clears `activeProviderId` too if this was the active one. */
export const disconnectProvider = async (providerId: CloudProviderId): Promise<void> => {
  const connection = cloudSyncStateSignal.value.connections[providerId];
  if (connection) {
    try {
      await postToWorker({
        type: "disconnect",
        requestId: nextRequestId(),
        providerId,
        connection,
      });
    } catch {
      // Best-effort - still clear local state below even if this failed.
    }
  }

  const nextStatuses = { ...cloudSyncStateSignal.value.statuses };
  delete nextStatuses[providerId];
  const nextActiveProviderId =
    cloudSyncStateSignal.value.activeProviderId === providerId
      ? null
      : cloudSyncStateSignal.value.activeProviderId;

  setConnection(providerId, undefined);
  cloudSyncStateSignal.value = {
    ...cloudSyncStateSignal.value,
    activeProviderId: nextActiveProviderId,
    statuses: nextStatuses,
  };
};

/** Bulk-replaces the five synced signals with a merge result - deliberately not routed through `addSavedBrew`/`deleteSavedBrew` etc, so applying a remote merge never records a new tombstone or re-stamps `updatedAt`. */
const applyMergedSyncState = (mergedState: ICloudSyncLocalState): void => {
  isApplyingRemoteSyncSignal.value = true;
  savedBrewsSignal.value = mergedState.savedBrews;
  savedShotsSignal.value = mergedState.savedShots;
  customBrewTypesSignal.value = mergedState.customBrewTypes;
  customStepLabelsSignal.value = mergedState.customStepLabels;
  syncTombstonesSignal.value = mergedState.tombstones;
  isApplyingRemoteSyncSignal.value = false;
};

let syncInFlight = false;
/** Set when `syncNow()` is called again while one's already running - runs exactly one more pass immediately after the in-flight one finishes, using whatever local state is current at that point, instead of dropping the request. */
let syncQueued = false;

const performSync = async (): Promise<void> => {
  const activeProviderId = cloudSyncStateSignal.value.activeProviderId;
  if (!activeProviderId) return;

  const connection = cloudSyncStateSignal.value.connections[activeProviderId];
  if (!connection) return;

  setStatus(activeProviderId, {
    ...cloudSyncStateSignal.value.statuses[activeProviderId],
    status: "syncing",
  });

  try {
    const localState: ICloudSyncLocalState = {
      savedBrews: savedBrewsSignal.value,
      savedShots: savedShotsSignal.value,
      customBrewTypes: customBrewTypesSignal.value,
      customStepLabels: customStepLabelsSignal.value,
      tombstones: syncTombstonesSignal.value,
    };

    const response = await postToWorker({
      type: "sync-now",
      requestId: nextRequestId(),
      providerId: activeProviderId,
      connection,
      localState,
      deviceId: getDeviceId(),
    });

    if (response.type === "sync-error") {
      throw new Error(response.message);
    }
    if (response.type !== "sync-result") {
      throw new Error("Unexpected response from the sync worker.");
    }

    applyMergedSyncState(response.mergedState);
    setConnection(activeProviderId, response.connection);
    setStatus(activeProviderId, response.status);
  } catch (error) {
    setStatus(activeProviderId, {
      status: "error",
      lastError: error instanceof Error ? error.message : "Sync failed.",
    });
  }
};

/**
 * The one shared sync entrypoint - called by the debounced-push effect, the
 * launch/reconnect pulls, and the manual "Sync now" button alike. A call
 * that arrives while one's already in flight is queued (not dropped) for a
 * single follow-up pass right after, so a push scheduled mid-pull still
 * lands, fully merged.
 */
export const syncNow = async (): Promise<void> => {
  if (syncInFlight) {
    syncQueued = true;
    return;
  }

  syncInFlight = true;
  try {
    await performSync();
  } finally {
    syncInFlight = false;
    if (syncQueued) {
      syncQueued = false;
      void syncNow();
    }
  }
};

let pushDebounceTimer: ReturnType<typeof setTimeout> | undefined;
let lastConsideredFingerprint: string | null = null;

/** Debounced auto-push: watches the five synced signals and schedules a `syncNow()` a few seconds after the last edit, coalescing bursts. */
effect(() => {
  const fingerprint = JSON.stringify({
    savedBrews: savedBrewsSignal.value,
    savedShots: savedShotsSignal.value,
    customBrewTypes: customBrewTypesSignal.value,
    customStepLabels: customStepLabelsSignal.value,
    tombstones: syncTombstonesSignal.value,
  });

  if (isApplyingRemoteSyncSignal.peek()) return;
  if (fingerprint === lastConsideredFingerprint) return;
  lastConsideredFingerprint = fingerprint;

  if (!cloudSyncStateSignal.peek().activeProviderId) return;

  clearTimeout(pushDebounceTimer);
  pushDebounceTimer = setTimeout(() => {
    void syncNow();
  }, PUSH_DEBOUNCE_MS);
});

let hasRunLaunchSync = false;
/** Runs `syncNow()` exactly once, as soon as `cloudSyncStateSignal` finishes loading from IndexedDB, if it turns out a provider is already connected - the launch-time pull-and-merge. */
effect(() => {
  const activeProviderId = cloudSyncStateSignal.value.activeProviderId;
  if (hasRunLaunchSync || !activeProviderId) return;
  hasRunLaunchSync = true;
  void syncNow();
});

onReconnect(() => {
  void syncNow();
});
