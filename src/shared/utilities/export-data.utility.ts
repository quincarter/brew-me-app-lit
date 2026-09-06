import { getAllPersistedData, replaceAllPersistedData } from "../stores/persistent-signal";

export interface IExportPayload {
  exportedAt: string;
  app: "brew-me";
  data: Record<string, unknown>;
}

/**
 * Persisted keys that must never leave the device in a "download my data"
 * export - `cloud-sync-state` holds live cloud-provider OAuth access/refresh
 * tokens. `getAllPersistedData` is deliberately generic over every persisted
 * key (see its own doc comment), so this is where it gets redacted rather
 * than exported in plaintext alongside saved brews. (The PKCE pending-auth
 * attempt lives in `sessionStorage`, not here, so it never reaches
 * `getAllPersistedData` in the first place - see `cloud-sync.store.ts`.)
 */
const EXPORT_EXCLUDED_KEYS = new Set(["cloud-sync-state"]);

/** Drops `EXPORT_EXCLUDED_KEYS` from a persisted-data snapshot. Pure/testable - kept separate from `exportAppData` so the redaction itself doesn't need IndexedDB mocked to test. */
export const redactSensitiveExportKeys = (data: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(data).filter(([key]) => !EXPORT_EXCLUDED_KEYS.has(key)));

/**
 * Builds the exportable payload from raw persisted data. Kept pure/testable
 * - no DOM access - so tests don't need to mock a download.
 */
export const buildExportPayload = (
  data: Record<string, unknown>,
  exportedAt: Date = new Date(),
): IExportPayload => ({
  exportedAt: exportedAt.toISOString(),
  app: "brew-me",
  data,
});

/** Zero-padded YYYY-MM-DD filename, e.g. "brew-me-export-2026-08-09.json". */
export const buildExportFilename = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `brew-me-export-${year}-${month}-${day}.json`;
};

/**
 * Triggers a browser download of `payload` as a JSON file named `filename`.
 * Kept separate from the pure builder functions above so those can be
 * tested without mocking `Blob`/`URL`/DOM element creation.
 */
export const downloadJsonFile = (filename: string, payload: unknown): void => {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 * Orchestrates a full "download my data" export: reads everything persisted
 * to IndexedDB and downloads it as a JSON file. Throws on failure - callers
 * are expected to catch and surface a status message.
 */
export const exportAppData = async (): Promise<void> => {
  const data = await getAllPersistedData();
  const payload = buildExportPayload(redactSensitiveExportKeys(data));
  const filename = buildExportFilename();
  downloadJsonFile(filename, payload);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Parses and validates the raw text of an imported file against the
 * `IExportPayload` shape. Pure/testable - no DOM/File access here. Throws a
 * descriptive `Error` on invalid JSON or an unexpected shape rather than
 * swallowing the problem, so callers can surface a status message.
 */
export const parseImportPayload = (raw: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(raw);

  if (!isRecord(parsed) || parsed.app !== "brew-me" || !isRecord(parsed.data)) {
    throw new Error("Not a valid BrewMe export file.");
  }

  return parsed.data;
};

/** Wraps `FileReader` in a `Promise` so callers can `await` a file's text contents. */
export const readFileAsText = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

/**
 * Orchestrates a full "restore my data" import: reads `file`, validates and
 * parses it, then replaces everything persisted in IndexedDB with its
 * contents. Throws on any failure - callers are expected to catch and surface
 * a status message. Deliberately does not reload the page; that's a
 * page-level side effect the caller (settings-page) is responsible for, so
 * this stays testable without mocking `window.location`.
 */
export const importAppData = async (file: File): Promise<void> => {
  const raw = await readFileAsText(file);
  const data = parseImportPayload(raw);
  await replaceAllPersistedData(data);
};
