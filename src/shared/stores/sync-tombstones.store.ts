import type { ISyncTombstone } from "../interfaces/cloud-sync.interface";
import { persistentSignal } from "./persistent-signal";

/** Cap on the tombstone list - old entries are dropped oldest-first rather than time-swept, since the whole dataset is small. */
const MAX_TOMBSTONES = 500;

/**
 * Deleted-saved-brew ids, kept alongside (not inside) `cloud-sync.store.ts`
 * so `brew.store.ts` can record a tombstone without depending on the whole
 * cloud-sync module. Read by the sync engine's merge step so a pull from a
 * provider that still has a since-deleted brew doesn't resurrect it.
 */
export const syncTombstonesSignal = persistentSignal<ISyncTombstone[]>([], {
  key: "sync-tombstones",
});

export const recordSyncTombstone = (id: number): void => {
  const next = [...syncTombstonesSignal.value, { id, deletedAt: Date.now() }];
  syncTombstonesSignal.value = next.slice(-MAX_TOMBSTONES);
};
