const RELOAD_FLAG_KEY = "brewme-chunk-reload-attempted";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 300;

// Matches the error messages browsers throw when a dynamically-imported
// chunk's underlying file is missing (stale hash after a deploy, or purged
// by dev-mode HMR) - not just any failure inside the imported module itself.
const CHUNK_LOAD_ERROR_PATTERN =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isChunkLoadError = (error: unknown): boolean =>
  error instanceof Error && CHUNK_LOAD_ERROR_PATTERN.test(error.message);

/**
 * Runs a dynamic `import()` and retries it a few times before giving up.
 * Dynamic route chunks can 404 when a deploy or dev-mode HMR update purges
 * the asset hashes an already-loaded page still references (see GH #21).
 * Only errors that look like a genuine chunk-load failure are retried - a
 * real error thrown by the imported module itself (a bug, not a missing
 * file) rethrows immediately instead of being masked by a reload.
 *
 * A short retry loop clears transient network blips; if the chunk is
 * genuinely gone (stale hash after a deploy), a single full page reload
 * picks up the current `index.html` and its current chunk hashes. The
 * reload is attempted at most once per session (via `sessionStorage`) so a
 * chunk that's missing for a real reason - not a stale deploy - fails loudly
 * instead of reload-looping forever.
 */
export const importWithRetry = async <T>(importer: () => Promise<T>): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await importer();
    } catch (error) {
      if (!isChunkLoadError(error)) throw error;
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await wait(RETRY_DELAY_MS * attempt);
      }
    }
  }

  if (typeof window !== "undefined" && !window.sessionStorage.getItem(RELOAD_FLAG_KEY)) {
    window.sessionStorage.setItem(RELOAD_FLAG_KEY, "true");
    window.location.reload();
    // Reload is async; keep the caller pending rather than resolving to a
    // half-loaded route while the browser navigates away.
    return new Promise<T>(() => {});
  }

  throw lastError;
};
