import { effect, signal, type Signal } from "@lit-labs/preact-signals";
import { type IDBPDatabase, openDB } from "idb";

const DB_NAME = "brew-me-store";
const STORE_NAME = "signals";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export interface PersistentSignalOptions {
  /**
   * Unique key for persistence. If omitted, persistence is disabled.
   */
  key?: string;
}

/**
 * One entry per live persistent signal, tracked so `flushPendingWrites`
 * (below) can find every signal whose in-memory value hasn't actually
 * landed in IndexedDB yet, without every call site having to thread its own
 * signal through some shared flush call. `lastWrittenValue` is compared by
 * reference, not deep equality - every store built on `persistentSignal`
 * already follows an immutable-update convention (`.map()`/spread/etc.,
 * never mutating in place), so a changed value always means a new
 * reference.
 */
interface PersistentSignalEntry {
  getValue: () => unknown;
  lastWrittenValue: unknown;
}
const registry = new Map<string, PersistentSignalEntry>();

let flushListenersInstalled = false;

/**
 * A page can be discarded with no further warning shortly after
 * `visibilitychange`/`pagehide` fire - most commonly on mobile, where
 * backgrounding a tab (switching apps, locking the screen) can lead to the
 * OS killing the renderer process to reclaim memory well before the
 * `effect()`-driven write below has had a chance to complete (IndexedDB
 * transactions resolve on the task queue, not immediately). Reacting to
 * both events - `visibilitychange` also covers the tab simply being backgrounded
 * without a full teardown, `pagehide` covers actual navigation away - gives
 * `flushPendingWrites` the earliest possible signal to make a last attempt.
 */
function installFlushListenersOnce(): void {
  if (flushListenersInstalled || typeof document === "undefined") return;
  flushListenersInstalled = true;

  const onPotentialTeardown = (): void => {
    void flushPendingWrites();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") onPotentialTeardown();
  });
  window.addEventListener("pagehide", onPotentialTeardown);
}

/**
 * Forces a durable write of every persistent signal whose current value
 * hasn't been confirmed written yet - the tab's last chance to persist
 * before it's backgrounded/discarded. Every dirty key is written in one
 * `"strict"`-durability transaction (rather than each signal's own
 * `"default"`-durability effect) so the commit is flushed to disk
 * immediately instead of possibly being buffered, since there may be no
 * further opportunity for the OS to give this page CPU time at all.
 */
async function flushPendingWrites(): Promise<void> {
  const dirty = [...registry].filter(([, entry]) => entry.getValue() !== entry.lastWrittenValue);
  if (dirty.length === 0) return;

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite", { durability: "strict" });
    dirty.forEach(([key, entry]) => {
      const value = entry.getValue();
      entry.lastWrittenValue = value;
      void tx.store.put(value, key);
    });
    await tx.done;
  } catch (error) {
    console.error("Failed to flush pending persistent signals:", error);
  }
}

/**
 * Creates a signal with optional IndexedDB persistence.
 *
 * @param defaultValue The initial value of the signal.
 * @param options Configuration options, including the persistence key.
 * @returns A signal that optionally persists its value to IndexedDB.
 */
export function persistentSignal<T>(
  defaultValue: T,
  options: PersistentSignalOptions = {},
): Signal<T> {
  const { key } = options;
  const s = signal<T>(defaultValue);

  if (!key) {
    return s;
  }

  installFlushListenersOnce();
  const entry: PersistentSignalEntry = { getValue: () => s.value, lastWrittenValue: defaultValue };
  registry.set(key, entry);

  const initialized = signal(false);

  // Load initial value from IndexedDB
  getDB()
    .then(async (db) => {
      try {
        const storedValue = await db.get(STORE_NAME, key);
        if (storedValue !== undefined) {
          s.value = storedValue;
          entry.lastWrittenValue = storedValue;
        }
      } catch (error) {
        console.error(`Failed to load persistent signal for key "${key}":`, error);
      } finally {
        initialized.value = true;
      }
    })
    .catch((error) => {
      console.error(`Failed to open IndexedDB for key "${key}":`, error);
      initialized.value = true;
    });

  // Persist changes to IndexedDB
  effect(() => {
    const value = s.value;
    // Wait until initialization is complete to avoid overwriting DB with default
    // values or ignoring updates that happened during load.
    if (!initialized.value) {
      return;
    }

    (async () => {
      try {
        const db = await getDB();
        await db.put(STORE_NAME, value, key);
        entry.lastWrittenValue = value;
      } catch (error) {
        console.error(`Failed to persist signal for key "${key}":`, error);
      }
    })();
  });

  return s;
}

/**
 * Clears all persisted signals from IndexedDB.
 */
export async function clearPersistentSignals(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Reads every key/value pair currently persisted in IndexedDB, keyed by the
 * same keys passed to `persistentSignal`. Reads the store directly rather
 * than hardcoding known keys, so it stays correct as new persistent signals
 * are added.
 */
export async function getAllPersistedData(): Promise<Record<string, unknown>> {
  const db = await getDB();
  // Read keys and values from the same transaction so a concurrent write
  // (e.g. `persistentSignal`'s effect firing mid-export) can't shift array
  // indices between two separate reads and zip a value to the wrong key.
  const tx = db.transaction(STORE_NAME, "readonly");
  const [keys, values] = await Promise.all([tx.store.getAllKeys(), tx.store.getAll()]);
  await tx.done;

  const data: Record<string, unknown> = {};
  keys.forEach((key, index) => {
    data[String(key)] = values[index];
  });
  return data;
}

/**
 * Fully replaces the contents of the persisted signals store with `data`, in
 * one `readwrite` transaction. This is a snapshot restore (matching the
 * export's full-snapshot semantics), not a merge - existing keys not present
 * in `data` are dropped.
 */
export async function replaceAllPersistedData(data: Record<string, unknown>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.clear();
  await Promise.all(Object.entries(data).map(([key, value]) => tx.store.put(value, key)));
  await tx.done;
}
