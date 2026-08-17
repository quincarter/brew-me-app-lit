let wakeLock: WakeLockSentinel | null = null;
let desired = false;
let listenerAttached = false;

/** Screen Wake Lock API - unsupported on iOS Safari and older browsers. */
export const isWakeLockSupported = (): boolean =>
  typeof navigator !== "undefined" && "wakeLock" in navigator;

const requestLock = async (): Promise<void> => {
  if (!isWakeLockSupported() || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch (error) {
    console.error("[BrewMe] Failed to acquire screen wake lock.", error);
  }
};

/**
 * The OS/browser silently releases an active wake lock whenever the tab is
 * hidden (e.g. the person switches apps mid-pour to check a timer notification)
 * and never re-acquires it on its own - so this listens for the tab becoming
 * visible again and re-requests the lock if it's still meant to be held.
 */
const attachVisibilityListener = (): void => {
  if (listenerAttached || typeof document === "undefined") return;
  listenerAttached = true;
  document.addEventListener("visibilitychange", () => {
    if (desired && document.visibilityState === "visible") {
      void requestLock();
    }
  });
};

/**
 * Keeps the screen from sleeping while `active` is true - used to hold the
 * screen awake for the duration of a running pour-over timer. A no-op on
 * browsers without the Screen Wake Lock API.
 */
export const setWakeLockActive = (active: boolean): void => {
  desired = active;
  if (active) {
    attachVisibilityListener();
    void requestLock();
    return;
  }

  if (wakeLock) {
    void wakeLock.release();
    wakeLock = null;
  }
};
