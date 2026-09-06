import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ICloudProviderConnection } from "../../interfaces/cloud-sync.interface";
import { clearPersistentSignals } from "../persistent-signal";

/** Stands in for `sync.worker.ts` in tests - `getWorker()` in `cloud-sync.store.ts` sees this instead of a real Worker once `vi.stubGlobal("Worker", MockWorker)` runs. */
class MockWorker {
  static instances: MockWorker[] = [];
  postMessage = vi.fn();
  private _listeners: ((event: MessageEvent) => void)[] = [];

  constructor() {
    MockWorker.instances.push(this);
  }

  addEventListener(_type: string, listener: (event: MessageEvent) => void): void {
    this._listeners.push(listener);
  }

  removeEventListener(): void {}

  /** Simulates the worker replying with `data`. */
  respond(data: unknown): void {
    this._listeners.forEach((listener) => listener({ data } as MessageEvent));
  }
}

const makeConnection = (
  overrides: Partial<ICloudProviderConnection> = {},
): ICloudProviderConnection => ({
  providerId: "dropbox",
  accountLabel: "quin@example.com",
  connectedAt: Date.now(),
  tokens: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60 * 60 * 1000,
    scope: "files.content.write",
    obtainedAt: Date.now(),
  },
  ...overrides,
});

const EMPTY_MERGED_STATE = {
  savedBrews: [],
  savedShots: [],
  customBrewTypes: [],
  customStepLabels: [],
  tombstones: [],
};

/** Lets any already-scheduled microtask continuations (e.g. an async function's post-`await` code) run to completion before the test's next assertion. */
const flushMicrotasks = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};

/**
 * Directly assigning `cloudSyncStateSignal.value` with a connected provider
 * (as every test below does, to seed "already connected" state without
 * going through the full PKCE round trip) triggers the same launch-time
 * `syncNow()` effect a real persisted connection loading from IndexedDB at
 * app start would - by design, per `cloud-sync.store.ts`'s "run once on
 * launch if already connected" effect. Responds to that one extra
 * `sync-now` message with a no-op merge and waits for it to fully settle,
 * so each test's *own* assertions start from a clean `syncInFlight: false`
 * slate instead of racing the launch sync.
 */
const settleLaunchSync = async (worker: MockWorker): Promise<void> => {
  const launchMessage = worker.postMessage.mock.calls[0]?.[0];
  worker.respond({
    type: "sync-result",
    requestId: launchMessage.requestId,
    providerId: "dropbox",
    mergedState: EMPTY_MERGED_STATE,
    connection: makeConnection(),
    status: { status: "idle", lastSyncedAt: Date.now() },
  });
  await flushMicrotasks();
};

describe("cloud-sync.store", () => {
  beforeEach(async () => {
    await clearPersistentSignals();
    sessionStorage.clear();
    vi.resetModules();
    MockWorker.instances = [];
    vi.stubGlobal("Worker", MockWorker);
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "test-client-id");
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "test-client-id");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("getDeviceId generates a device id once and reuses it on later calls", async () => {
    const { getDeviceId } = await import("../cloud-sync.store");

    const first = getDeviceId();
    const second = getDeviceId();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it("connectProvider stores a pending PKCE attempt and navigates to Dropbox's authorization URL", async () => {
    const { connectProvider } = await import("../cloud-sync.store");
    await connectProvider("dropbox");

    expect(window.location.href).toContain("https://www.dropbox.com/oauth2/authorize");
    const url = new URL(window.location.href);
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
  });

  it("completeProviderConnect exchanges the code via the worker and persists the resulting connection as active", async () => {
    const store = await import("../cloud-sync.store");
    await store.connectProvider("dropbox");
    const state = new URL(window.location.href).searchParams.get("state") ?? "";

    const resultPromise = store.completeProviderConnect("auth-code", state);

    const worker = MockWorker.instances[MockWorker.instances.length - 1];
    expect(worker?.postMessage).toHaveBeenCalledTimes(1);
    const sentMessage = worker?.postMessage.mock.calls[0][0];
    expect(sentMessage.type).toBe("connect");
    expect(sentMessage.providerId).toBe("dropbox");

    const connection = makeConnection();
    worker?.respond({
      type: "connected",
      requestId: sentMessage.requestId,
      providerId: "dropbox",
      connection,
    });

    await resultPromise;

    expect(store.cloudSyncStateSignal.value.activeProviderId).toBe("dropbox");
    expect(store.cloudSyncStateSignal.value.connections.dropbox).toEqual(connection);
  });

  it("connectProvider/completeProviderConnect dispatch to whichever provider actually initiated the attempt, not just Dropbox", async () => {
    const store = await import("../cloud-sync.store");
    await store.connectProvider("onedrive");
    const state = new URL(window.location.href).searchParams.get("state") ?? "";

    expect(window.location.href).toContain(
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    );

    const resultPromise = store.completeProviderConnect("auth-code", state);

    const worker = MockWorker.instances[MockWorker.instances.length - 1];
    const sentMessage = worker?.postMessage.mock.calls[0][0];
    expect(sentMessage.type).toBe("connect");
    expect(sentMessage.providerId).toBe("onedrive");

    const connection = makeConnection({ providerId: "onedrive" });
    worker?.respond({
      type: "connected",
      requestId: sentMessage.requestId,
      providerId: "onedrive",
      connection,
    });

    await resultPromise;

    expect(store.cloudSyncStateSignal.value.activeProviderId).toBe("onedrive");
    expect(store.cloudSyncStateSignal.value.connections.onedrive).toEqual(connection);
  });

  it("completeProviderConnect succeeds from a fresh module instance, simulating the real OAuth redirect's full page reload", async () => {
    // Regression test: the OAuth redirect is a real `window.location.href`
    // full-page navigation, so `oauth-callback-page` runs in a brand-new
    // module instance from the one that called `connectProvider` - a
    // persistentSignal-backed pending attempt raced its own async IndexedDB
    // load against this immediate read and lost, always. Only `sessionStorage`
    // (a browser global, unaffected by `vi.resetModules()`) actually proves
    // this survives that boundary the way a real redirect does.
    const firstLoad = await import("../cloud-sync.store");
    await firstLoad.connectProvider("dropbox");
    const state = new URL(window.location.href).searchParams.get("state") ?? "";

    vi.resetModules();
    const secondLoad = await import("../cloud-sync.store");

    const resultPromise = secondLoad.completeProviderConnect("auth-code", state);
    const worker = MockWorker.instances[MockWorker.instances.length - 1];
    const sentMessage = worker?.postMessage.mock.calls[0][0];
    worker?.respond({
      type: "connected",
      requestId: sentMessage.requestId,
      providerId: "dropbox",
      connection: makeConnection(),
    });

    await expect(resultPromise).resolves.toBeUndefined();
    expect(secondLoad.cloudSyncStateSignal.value.activeProviderId).toBe("dropbox");
  });

  it("completeProviderConnect rejects when the state doesn't match a pending attempt", async () => {
    const { completeProviderConnect } = await import("../cloud-sync.store");

    await expect(completeProviderConnect("auth-code", "unknown-state")).rejects.toThrow(
      /no matching/i,
    );
  });

  it("disconnectProvider clears the connection/status and unsets activeProviderId", async () => {
    const store = await import("../cloud-sync.store");
    store.cloudSyncStateSignal.value = {
      activeProviderId: "dropbox",
      connections: { dropbox: makeConnection() },
      statuses: { dropbox: { status: "idle", lastSyncedAt: Date.now() } },
    };
    const worker = MockWorker.instances[MockWorker.instances.length - 1];
    await settleLaunchSync(worker);

    const resultPromise = store.disconnectProvider("dropbox");
    const sentMessage = worker.postMessage.mock.calls.find(
      (call) => call[0].type === "disconnect",
    )?.[0];
    worker.respond({
      type: "disconnected",
      requestId: sentMessage.requestId,
      providerId: "dropbox",
    });
    await resultPromise;

    expect(store.cloudSyncStateSignal.value.activeProviderId).toBeNull();
    expect(store.cloudSyncStateSignal.value.connections.dropbox).toBeUndefined();
    expect(store.cloudSyncStateSignal.value.statuses.dropbox).toBeUndefined();
  });

  it("syncNow applies a merged result to the local signals and doesn't itself trigger another debounced push", async () => {
    const store = await import("../cloud-sync.store");
    const brewStore = await import("../brew.store");

    store.cloudSyncStateSignal.value = {
      activeProviderId: "dropbox",
      connections: { dropbox: makeConnection() },
      statuses: {},
    };
    const worker = MockWorker.instances[MockWorker.instances.length - 1];
    await settleLaunchSync(worker);

    const postCountBeforeSync = worker.postMessage.mock.calls.length;
    const syncPromise = store.syncNow();

    expect(worker.postMessage.mock.calls.length).toBe(postCountBeforeSync + 1);
    const sentMessage = worker.postMessage.mock.calls[worker.postMessage.mock.calls.length - 1][0];
    expect(sentMessage.type).toBe("sync-now");
    expect(sentMessage.localState.savedBrews).toEqual([]);

    const remoteBrew = {
      id: 1,
      brewType: "V60",
      ratio: 16,
      water: 320,
      coffee: 20,
      oz: 10.8,
      createdAt: 1,
      updatedAt: 1,
    };
    worker.respond({
      type: "sync-result",
      requestId: sentMessage.requestId,
      providerId: "dropbox",
      mergedState: { ...EMPTY_MERGED_STATE, savedBrews: [remoteBrew] },
      connection: makeConnection(),
      status: { status: "idle", lastSyncedAt: Date.now() },
    });

    await syncPromise;

    expect(brewStore.savedBrewsSignal.value).toEqual([remoteBrew]);
    expect(store.isApplyingRemoteSyncSignal.value).toBe(false);

    // Applying the merge just now (savedBrewsSignal going from [] to
    // [remoteBrew]) touched the same five signals a debounced push watches -
    // confirm it didn't schedule a redundant push of the data just pulled.
    const postCountAfterApply = worker.postMessage.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(worker.postMessage.mock.calls.length).toBe(postCountAfterApply);
  });

  it("includes saved shots in the outgoing localState and applies a pulled shot", async () => {
    const store = await import("../cloud-sync.store");
    const shotStore = await import("../shot.store");

    store.cloudSyncStateSignal.value = {
      activeProviderId: "dropbox",
      connections: { dropbox: makeConnection() },
      statuses: {},
    };
    const worker = MockWorker.instances[MockWorker.instances.length - 1];
    await settleLaunchSync(worker);

    // Added after the launch sync settles - settleLaunchSync's own
    // EMPTY_MERGED_STATE response bulk-overwrites savedShotsSignal, so
    // adding beforehand would just get wiped out by that no-op merge.
    shotStore.addShot({
      savedBrewId: 1,
      elapsedSeconds: 30,
      scaleSamples: [],
      monitorSamples: [],
    });

    const syncPromise = store.syncNow();
    const sentMessage = worker.postMessage.mock.calls[worker.postMessage.mock.calls.length - 1][0];
    expect(sentMessage.localState.savedShots).toHaveLength(1);

    const remoteShot = {
      id: 2,
      savedBrewId: 5,
      createdAt: 2,
      elapsedSeconds: 45,
      scaleSamples: [],
      monitorSamples: [],
    };
    worker.respond({
      type: "sync-result",
      requestId: sentMessage.requestId,
      providerId: "dropbox",
      mergedState: { ...EMPTY_MERGED_STATE, savedShots: [remoteShot] },
      connection: makeConnection(),
      status: { status: "idle", lastSyncedAt: Date.now() },
    });
    await syncPromise;

    expect(shotStore.savedShotsSignal.value).toEqual([remoteShot]);
  });

  it("a genuine local edit after applying a merge still schedules a debounced push", async () => {
    const store = await import("../cloud-sync.store");
    const brewStore = await import("../brew.store");

    store.cloudSyncStateSignal.value = {
      activeProviderId: "dropbox",
      connections: { dropbox: makeConnection() },
      statuses: {},
    };
    const worker = MockWorker.instances[MockWorker.instances.length - 1];
    await settleLaunchSync(worker);

    const countAfterApply = worker.postMessage.mock.calls.length;

    brewStore.addSavedBrew({
      brewType: "Chemex",
      ratio: 15,
      water: 400,
      coffee: 26.7,
      oz: 13.5,
    });

    await vi.advanceTimersByTimeAsync(10_000);

    expect(worker.postMessage.mock.calls.length).toBeGreaterThan(countAfterApply);
  });
});
