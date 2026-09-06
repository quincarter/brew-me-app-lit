import { describe, expect, it, vi } from "vitest";
import type { ISavedBrew } from "../../interfaces/brew.interface";
import type {
  ICloudAuthAdapter,
  ICloudFileAdapter,
  ICloudProviderConnection,
  ISyncEnvelope,
} from "../../interfaces/cloud-sync.interface";
import type { IBrewShot } from "../../interfaces/shot.interface";
import { type ICloudSyncLocalState, mergeSyncState, runSync } from "../sync-engine";

const LOCAL_DEVICE_ID = "device-local";
const REMOTE_DEVICE_ID = "device-remote";

const makeBrew = (overrides: Partial<ISavedBrew> & { id: number }): ISavedBrew => ({
  brewType: "V60",
  ratio: 16,
  water: 320,
  coffee: 20,
  oz: 10.8,
  createdAt: 1000,
  ...overrides,
});

const makeShot = (overrides: Partial<IBrewShot> & { id: number }): IBrewShot => ({
  savedBrewId: 1,
  createdAt: 1000,
  elapsedSeconds: 30,
  scaleSamples: [],
  monitorSamples: [],
  ...overrides,
});

const makeLocalState = (overrides: Partial<ICloudSyncLocalState> = {}): ICloudSyncLocalState => ({
  savedBrews: [],
  savedShots: [],
  customBrewTypes: [],
  customStepLabels: [],
  tombstones: [],
  ...overrides,
});

const makeEnvelope = (overrides: Partial<ISyncEnvelope> = {}): ISyncEnvelope => ({
  schemaVersion: 1,
  deviceId: REMOTE_DEVICE_ID,
  savedAt: 2000,
  savedBrews: [],
  savedShots: [],
  customBrewTypes: [],
  customStepLabels: [],
  tombstones: [],
  ...overrides,
});

describe("mergeSyncState", () => {
  it("keeps a local-only brew when there's no remote file yet", () => {
    const local = makeLocalState({ savedBrews: [makeBrew({ id: 1, updatedAt: 100 })] });

    const { merged, changed } = mergeSyncState(local, null, LOCAL_DEVICE_ID);

    expect(merged.savedBrews).toEqual(local.savedBrews);
    expect(changed).toBe(true);
  });

  it("adopts a remote-only brew that isn't present locally", () => {
    const local = makeLocalState();
    const remoteBrew = makeBrew({ id: 2, updatedAt: 500 });
    const remote = makeEnvelope({ savedBrews: [remoteBrew] });

    const { merged, changed } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.savedBrews).toEqual([remoteBrew]);
    expect(changed).toBe(false);
  });

  it("keeps the local copy when both exist and local was edited more recently", () => {
    const localBrew = makeBrew({ id: 3, name: "Local edit", updatedAt: 900 });
    const remoteBrew = makeBrew({ id: 3, name: "Remote edit", updatedAt: 500 });
    const local = makeLocalState({ savedBrews: [localBrew] });
    const remote = makeEnvelope({ savedBrews: [remoteBrew] });

    const { merged, changed } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.savedBrews).toEqual([localBrew]);
    expect(changed).toBe(true);
  });

  it("keeps the remote copy when both exist and remote was edited more recently", () => {
    const localBrew = makeBrew({ id: 4, name: "Local edit", updatedAt: 100 });
    const remoteBrew = makeBrew({ id: 4, name: "Remote edit", updatedAt: 800 });
    const local = makeLocalState({ savedBrews: [localBrew] });
    const remote = makeEnvelope({ savedBrews: [remoteBrew] });

    const { merged, changed } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.savedBrews).toEqual([remoteBrew]);
    expect(changed).toBe(false);
  });

  it("doesn't resurrect a brew a local tombstone deleted after the remote's last edit", () => {
    const remoteBrew = makeBrew({ id: 5, updatedAt: 100 });
    const local = makeLocalState({ tombstones: [{ id: 5, deletedAt: 200 }] });
    const remote = makeEnvelope({ savedBrews: [remoteBrew] });

    const { merged, changed } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.savedBrews).toEqual([]);
    expect(changed).toBe(true);
  });

  it("un-deletes a brew when it was edited again after the tombstone's deletedAt", () => {
    const remoteBrew = makeBrew({ id: 6, updatedAt: 300 });
    const local = makeLocalState({ tombstones: [{ id: 6, deletedAt: 200 }] });
    const remote = makeEnvelope({ savedBrews: [remoteBrew] });

    const { merged } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.savedBrews).toEqual([remoteBrew]);
  });

  it("breaks an exact updatedAt tie deterministically by comparing deviceId strings", () => {
    const localBrew = makeBrew({ id: 7, name: "Local", updatedAt: 400 });
    const remoteBrewWinning = makeBrew({ id: 7, name: "Remote", updatedAt: 400 });
    const local = makeLocalState({ savedBrews: [localBrew] });
    const remote = makeEnvelope({ savedBrews: [remoteBrewWinning], deviceId: "zzz-device" });

    // "zzz-device" > "device-local" (this device), so remote wins the tie.
    const { merged: mergedRemoteWins } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);
    expect(mergedRemoteWins.savedBrews).toEqual([remoteBrewWinning]);

    // "aaa-device" < "device-local", so local wins the tie instead.
    const remoteLosesTie = makeEnvelope({
      savedBrews: [remoteBrewWinning],
      deviceId: "aaa-device",
    });
    const { merged: mergedLocalWins } = mergeSyncState(local, remoteLosesTie, LOCAL_DEVICE_ID);
    expect(mergedLocalWins.savedBrews).toEqual([localBrew]);
  });

  it("unions and case-insensitively dedupes custom brew types/step labels", () => {
    const local = makeLocalState({
      customBrewTypes: ["Cold Brew", "siphon"],
      customStepLabels: ["Bloom"],
    });
    const remote = makeEnvelope({
      customBrewTypes: ["cold brew", "Moka Pot"],
      customStepLabels: ["bloom", "Drawdown"],
    });

    const { merged } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.customBrewTypes).toEqual(["Cold Brew", "siphon", "Moka Pot"]);
    expect(merged.customStepLabels).toEqual(["Bloom", "Drawdown"]);
  });

  it("reports unchanged when the merge exactly matches what's already remote", () => {
    const brew = makeBrew({ id: 8, updatedAt: 100 });
    const local = makeLocalState({ savedBrews: [brew] });
    const remote = makeEnvelope({ savedBrews: [brew], deviceId: LOCAL_DEVICE_ID });

    const { changed } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(changed).toBe(false);
  });

  it("unions local-only and remote-only shots (append-only, no LWW needed)", () => {
    const localShot = makeShot({ id: 1, createdAt: 100 });
    const remoteShot = makeShot({ id: 2, createdAt: 200 });
    const local = makeLocalState({ savedShots: [localShot] });
    const remote = makeEnvelope({ savedShots: [remoteShot] });

    const { merged } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.savedShots).toEqual(expect.arrayContaining([localShot, remoteShot]));
    expect(merged.savedShots).toHaveLength(2);
  });

  it("breaks a colliding shot id tie by the later createdAt, then by deviceId", () => {
    const localShot = makeShot({ id: 9, createdAt: 300 });
    const remoteShotNewer = makeShot({ id: 9, createdAt: 700 });
    const local = makeLocalState({ savedShots: [localShot] });
    const remote = makeEnvelope({ savedShots: [remoteShotNewer] });

    const { merged } = mergeSyncState(local, remote, LOCAL_DEVICE_ID);

    expect(merged.savedShots).toEqual([remoteShotNewer]);

    // Exact-tie createdAt falls back to the same deviceId string comparison
    // as saved brews.
    const remoteShotSameTime = makeShot({ id: 9, createdAt: 300 });
    const { merged: tieBreak } = mergeSyncState(
      local,
      makeEnvelope({ savedShots: [remoteShotSameTime], deviceId: "zzz-device" }),
      LOCAL_DEVICE_ID,
    );
    expect(tieBreak.savedShots).toEqual([remoteShotSameTime]);
  });

  it("doesn't crash on a real legacy remote envelope written before savedShots existed", () => {
    // Regression test: an already-connected account's remote file, synced
    // before `savedShots` was added to the schema, has no `savedShots` key
    // at all - `as unknown as ISyncEnvelope` simulates that real shape
    // rather than a hypothetical one, since the compile-time type can't
    // express "optional in practice, required by the type."
    const legacyRemote = {
      schemaVersion: 1,
      deviceId: REMOTE_DEVICE_ID,
      savedAt: 1000,
      savedBrews: [],
      customBrewTypes: [],
      customStepLabels: [],
      tombstones: [],
    } as unknown as ISyncEnvelope;
    const local = makeLocalState({ savedShots: [makeShot({ id: 1 })] });

    expect(() => mergeSyncState(local, legacyRemote, LOCAL_DEVICE_ID)).not.toThrow();

    const { merged, changed } = mergeSyncState(local, legacyRemote, LOCAL_DEVICE_ID);
    expect(merged.savedShots).toEqual(local.savedShots);
    expect(changed).toBe(true);
  });
});

describe("runSync", () => {
  const baseConnection: ICloudProviderConnection = {
    providerId: "dropbox",
    connectedAt: 1,
    tokens: {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60 * 60 * 1000,
      scope: "files.content.write",
      obtainedAt: Date.now(),
    },
  };

  const makeAuthAdapter = (): ICloudAuthAdapter => ({
    providerId: "dropbox",
    buildAuthorizationUrl: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    refreshTokens: vi.fn(),
  });

  it("writes back the merged envelope when the merge changed something relative to remote", async () => {
    const remoteEnvelope = makeEnvelope({ savedBrews: [] });
    const readSyncFile = vi.fn().mockResolvedValue({ envelope: remoteEnvelope, revision: "rev-1" });
    const writeSyncFile = vi.fn().mockResolvedValue({ revision: "rev-2" });
    const fileAdapter: ICloudFileAdapter = { providerId: "dropbox", readSyncFile, writeSyncFile };

    const localState = makeLocalState({ savedBrews: [makeBrew({ id: 1, updatedAt: 500 })] });

    const result = await runSync({
      fileAdapter,
      authAdapter: makeAuthAdapter(),
      connection: baseConnection,
      localState,
      deviceId: LOCAL_DEVICE_ID,
    });

    expect(writeSyncFile).toHaveBeenCalledTimes(1);
    expect(result.connection.lastKnownRevision).toBe("rev-2");
    expect(result.mergedState.savedBrews).toEqual(localState.savedBrews);
  });

  it("skips the write-back when the merge didn't change anything relative to remote", async () => {
    const brew = makeBrew({ id: 1, updatedAt: 500 });
    const remoteEnvelope = makeEnvelope({ savedBrews: [brew], deviceId: LOCAL_DEVICE_ID });
    const readSyncFile = vi.fn().mockResolvedValue({ envelope: remoteEnvelope, revision: "rev-1" });
    const writeSyncFile = vi.fn();
    const fileAdapter: ICloudFileAdapter = { providerId: "dropbox", readSyncFile, writeSyncFile };

    await runSync({
      fileAdapter,
      authAdapter: makeAuthAdapter(),
      connection: baseConnection,
      localState: makeLocalState({ savedBrews: [brew] }),
      deviceId: LOCAL_DEVICE_ID,
    });

    expect(writeSyncFile).not.toHaveBeenCalled();
  });

  it("proactively refreshes a near-expiry access token before calling the file adapter", async () => {
    const refreshedTokens = {
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60 * 60 * 1000,
      scope: "files.content.write",
      obtainedAt: Date.now(),
    };
    const authAdapter = makeAuthAdapter();
    authAdapter.refreshTokens = vi.fn().mockResolvedValue(refreshedTokens);

    const readSyncFile = vi.fn().mockResolvedValue(null);
    const writeSyncFile = vi.fn().mockResolvedValue({ revision: "rev-1" });
    const fileAdapter: ICloudFileAdapter = { providerId: "dropbox", readSyncFile, writeSyncFile };

    const expiringConnection: ICloudProviderConnection = {
      ...baseConnection,
      tokens: { ...baseConnection.tokens, expiresAt: Date.now() + 1000 },
    };

    const result = await runSync({
      fileAdapter,
      authAdapter,
      connection: expiringConnection,
      localState: makeLocalState(),
      deviceId: LOCAL_DEVICE_ID,
    });

    expect(authAdapter.refreshTokens).toHaveBeenCalledWith("refresh-token");
    expect(readSyncFile).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: expect.objectContaining({ accessToken: "new-access-token" }),
      }),
    );
    expect(result.connection.tokens.accessToken).toBe("new-access-token");
  });

  it("persists tokens the file adapter reports back from a reactive (mid-flight 401) refresh", async () => {
    const reactivelyRefreshedTokens = {
      accessToken: "reactive-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60 * 60 * 1000,
      scope: "files.content.write",
      obtainedAt: Date.now(),
    };

    // Not near-expiry, so `ensureFreshTokens` doesn't proactively refresh -
    // the only refresh here is the file adapter's own reactive one, reported
    // back via the `tokens` field on its result. Uses a real (non-matching)
    // remote envelope so `changed` is true and the write path runs too.
    const remoteEnvelope = makeEnvelope({ savedBrews: [makeBrew({ id: 99, updatedAt: 1 })] });
    const readSyncFile = vi
      .fn()
      .mockResolvedValue({ envelope: remoteEnvelope, tokens: reactivelyRefreshedTokens });
    const writeSyncFile = vi
      .fn()
      .mockResolvedValue({ revision: "rev-1", tokens: reactivelyRefreshedTokens });
    const fileAdapter: ICloudFileAdapter = { providerId: "dropbox", readSyncFile, writeSyncFile };

    const result = await runSync({
      fileAdapter,
      authAdapter: makeAuthAdapter(),
      connection: baseConnection,
      localState: makeLocalState({ savedBrews: [makeBrew({ id: 1, updatedAt: 500 })] }),
      deviceId: LOCAL_DEVICE_ID,
    });

    expect(result.connection.tokens.accessToken).toBe("reactive-access-token");
  });
});
