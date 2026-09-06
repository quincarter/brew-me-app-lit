import type {
  ICloudAuthAdapter,
  ICloudFileAdapter,
  ICloudProviderConnection,
  IProviderSyncStatus,
  ISyncEnvelope,
  ISyncTombstone,
} from "../interfaces/cloud-sync.interface";
import type { ISavedBrew } from "../interfaces/brew.interface";
import type { IBrewShot } from "../interfaces/shot.interface";

/**
 * The subset of local signal-store state that's synced - mirrors
 * `ISyncEnvelope`'s payload fields without the envelope-only bookkeeping
 * (`schemaVersion`/`deviceId`/`savedAt`). Kept separate from `ISyncEnvelope`
 * so `cloud-sync.store.ts` can hand over a plain snapshot of its signals
 * without needing to know envelope bookkeeping itself.
 */
export interface ICloudSyncLocalState {
  savedBrews: ISavedBrew[];
  savedShots: IBrewShot[];
  customBrewTypes: string[];
  customStepLabels: string[];
  tombstones: ISyncTombstone[];
}

const brewTimestamp = (brew: ISavedBrew): number => brew.updatedAt ?? brew.createdAt;

/** Case-insensitive dedupe, first occurrence wins - matches `addCustomBrewType`/`addCustomStepLabel`'s existing dedupe convention. */
const dedupeCaseInsensitive = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });
  return result;
};

/**
 * `items` may be `undefined` at runtime despite its type - `b` in
 * `isSameById`/`isSameStringSet` below comes straight from a remote
 * envelope parsed out of a JSON file that a previous, older version of this
 * app (or a schema addition like `savedShots`) may have written without a
 * field the current `ISyncEnvelope` type now requires. Falls back to an
 * empty array rather than trusting the type.
 */
const sortedById = <T extends { id: number }>(items: T[] | undefined): T[] =>
  [...(items ?? [])].sort((a, b) => a.id - b.id);

const isSameById = <T extends { id: number }>(a: T[], b: T[] | undefined): boolean =>
  JSON.stringify(sortedById(a)) === JSON.stringify(sortedById(b));

const isSameStringSet = (a: string[], b: string[] | undefined): boolean =>
  JSON.stringify([...a].sort()) === JSON.stringify([...(b ?? [])].sort());

/**
 * Union-by-id merge for the append-only shot log: unlike saved brews, a shot
 * is sealed once via `stopSession()` and never edited or deleted afterward,
 * so there's no `updatedAt`/tombstone concept to apply here - local-only and
 * remote-only shots are both just kept. An id collision (two devices sealing
 * a shot in the same millisecond, before ever syncing) is the one case both
 * sides have an entry for; broken deterministically the same way saved
 * brews break same-`updatedAt` ties, by comparing `createdAt` then
 * `deviceId`, so every device that runs this merge picks the same winner.
 */
const mergeShots = (
  localShots: IBrewShot[],
  remoteShots: IBrewShot[],
  remoteDeviceId: string | undefined,
  deviceId: string,
): IBrewShot[] => {
  const localById = new Map(localShots.map((shot) => [shot.id, shot] as const));
  const remoteById = new Map(remoteShots.map((shot) => [shot.id, shot] as const));
  const ids = new Set<number>([...localById.keys(), ...remoteById.keys()]);

  return [...ids].map((id) => {
    const localShot = localById.get(id);
    const remoteShot = remoteById.get(id);
    if (!localShot) return remoteShot as IBrewShot;
    if (!remoteShot) return localShot;
    if (localShot.createdAt !== remoteShot.createdAt) {
      return localShot.createdAt > remoteShot.createdAt ? localShot : remoteShot;
    }
    return remoteDeviceId && remoteDeviceId > deviceId ? remoteShot : localShot;
  });
};

/**
 * Pure, DOM-free last-write-wins merge of one device's local sync state
 * against the envelope last written to the connected provider (or `null` for
 * a brand-new connection with no remote file yet). Safe to import directly
 * in tests without a real `Worker` - `sync.worker.ts` is the only runtime
 * caller.
 *
 * - Per saved brew: local-only or remote-only keeps the one that exists;
 *   both present keeps the greater `updatedAt` (falling back to `createdAt`
 *   for a record with neither), an exact tie broken by comparing the
 *   envelope's `deviceId` against this device's `deviceId` (whichever
 *   string sorts later wins) - deterministic regardless of which device
 *   runs the merge.
 * - Tombstones from both sides are unioned (keeping the latest `deletedAt`
 *   per id) before deciding winners, so a delete recorded on either device
 *   blocks that id from resurrecting via the *other* side's copy, as long as
 *   the deletion happened after that copy's last edit - an edit made after
 *   the delete legitimately un-deletes it.
 * - `customBrewTypes`/`customStepLabels` are a simple case-insensitive
 *   union+dedupe (order: local entries first, then any new remote ones).
 * - `savedShots` is a plain union by id (see `mergeShots`) - shots are
 *   append-only, so there's no `updatedAt`/tombstone concept for them.
 */
export const mergeSyncState = (
  local: ICloudSyncLocalState,
  remote: ISyncEnvelope | null,
  deviceId: string,
): { merged: ICloudSyncLocalState; changed: boolean } => {
  const remoteBrews = remote?.savedBrews ?? [];
  // `savedShots` postdates the original envelope schema - an already-synced
  // remote file written before that addition simply won't have this key.
  const remoteShots = remote?.savedShots ?? [];
  const remoteDeviceId = remote?.deviceId;

  const localBrewMap = new Map(local.savedBrews.map((brew) => [brew.id, brew] as const));
  const remoteBrewMap = new Map(remoteBrews.map((brew) => [brew.id, brew] as const));

  const tombstoneMap = new Map<number, ISyncTombstone>();
  [...local.tombstones, ...(remote?.tombstones ?? [])].forEach((tombstone) => {
    const existing = tombstoneMap.get(tombstone.id);
    if (!existing || tombstone.deletedAt > existing.deletedAt) {
      tombstoneMap.set(tombstone.id, tombstone);
    }
  });

  const ids = new Set<number>([...localBrewMap.keys(), ...remoteBrewMap.keys()]);
  const mergedBrews: ISavedBrew[] = [];

  ids.forEach((id) => {
    const localBrew = localBrewMap.get(id);
    const remoteBrew = remoteBrewMap.get(id);

    let winner: ISavedBrew;
    if (localBrew && remoteBrew) {
      const localTime = brewTimestamp(localBrew);
      const remoteTime = brewTimestamp(remoteBrew);
      if (localTime > remoteTime) {
        winner = localBrew;
      } else if (remoteTime > localTime) {
        winner = remoteBrew;
      } else {
        winner = remoteDeviceId && remoteDeviceId > deviceId ? remoteBrew : localBrew;
      }
    } else {
      winner = (localBrew ?? remoteBrew) as ISavedBrew;
    }

    const tombstone = tombstoneMap.get(id);
    if (tombstone && tombstone.deletedAt >= brewTimestamp(winner)) {
      // Deleted (on either device) after the winning copy's last edit -
      // stays out of the merge instead of resurrecting.
      return;
    }

    mergedBrews.push(winner);
  });

  const merged: ICloudSyncLocalState = {
    savedBrews: mergedBrews,
    savedShots: mergeShots(local.savedShots, remoteShots, remoteDeviceId, deviceId),
    customBrewTypes: dedupeCaseInsensitive([
      ...local.customBrewTypes,
      ...(remote?.customBrewTypes ?? []),
    ]),
    customStepLabels: dedupeCaseInsensitive([
      ...local.customStepLabels,
      ...(remote?.customStepLabels ?? []),
    ]),
    tombstones: [...tombstoneMap.values()],
  };

  const changed =
    !remote ||
    !isSameById(merged.savedBrews, remote.savedBrews) ||
    !isSameById(merged.savedShots, remoteShots) ||
    !isSameStringSet(merged.customBrewTypes, remote.customBrewTypes) ||
    !isSameStringSet(merged.customStepLabels, remote.customStepLabels) ||
    !isSameById(merged.tombstones, remote.tombstones);

  return { merged, changed };
};

export interface IRunSyncParams {
  fileAdapter: ICloudFileAdapter;
  authAdapter: ICloudAuthAdapter;
  connection: ICloudProviderConnection;
  localState: ICloudSyncLocalState;
  deviceId: string;
}

export interface IRunSyncResult {
  mergedState: ICloudSyncLocalState;
  connection: ICloudProviderConnection;
  status: IProviderSyncStatus;
}

/** Refresh a bit before the token's real expiry so a slow request doesn't land right as it lapses. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

const ensureFreshTokens = async (
  authAdapter: ICloudAuthAdapter,
  connection: ICloudProviderConnection,
): Promise<ICloudProviderConnection> => {
  const { tokens } = connection;
  const isExpiringSoon = tokens.expiresAt - Date.now() < TOKEN_REFRESH_MARGIN_MS;
  if (!isExpiringSoon || !tokens.refreshToken) {
    return connection;
  }

  const refreshed = await authAdapter.refreshTokens(tokens.refreshToken);
  return { ...connection, tokens: refreshed };
};

/**
 * The worker's top-level orchestration: proactively refreshes a
 * near-expiry access token, pulls the remote envelope, merges it against
 * `localState`, and writes back only if the merge actually changed
 * anything relative to what's remote (or there was no remote file yet).
 * Returns the merged state plus an updated connection (new tokens/revision)
 * for the caller to persist.
 */
export const runSync = async ({
  fileAdapter,
  authAdapter,
  connection,
  localState,
  deviceId,
}: IRunSyncParams): Promise<IRunSyncResult> => {
  const freshConnection = await ensureFreshTokens(authAdapter, connection);

  const remoteResult = await fileAdapter.readSyncFile(freshConnection);
  const remoteEnvelope = remoteResult?.envelope ?? null;

  const { merged, changed } = mergeSyncState(localState, remoteEnvelope, deviceId);

  let nextConnection: ICloudProviderConnection = {
    ...freshConnection,
    tokens: remoteResult?.tokens ?? freshConnection.tokens,
    lastKnownRevision: remoteResult?.revision ?? freshConnection.lastKnownRevision,
    remoteFileId: remoteResult?.remoteFileId ?? freshConnection.remoteFileId,
  };

  if (changed || !remoteResult) {
    const envelope: ISyncEnvelope = {
      schemaVersion: 1,
      deviceId,
      savedAt: Date.now(),
      savedBrews: merged.savedBrews,
      savedShots: merged.savedShots,
      customBrewTypes: merged.customBrewTypes,
      customStepLabels: merged.customStepLabels,
      tombstones: merged.tombstones,
    };

    const writeResult = await fileAdapter.writeSyncFile(nextConnection, envelope);
    nextConnection = {
      ...nextConnection,
      tokens: writeResult.tokens ?? nextConnection.tokens,
      lastKnownRevision: writeResult.revision ?? nextConnection.lastKnownRevision,
      remoteFileId: writeResult.remoteFileId ?? nextConnection.remoteFileId,
    };
  }

  return {
    mergedState: merged,
    connection: nextConnection,
    status: { status: "idle", lastSyncedAt: Date.now() },
  };
};
