import { signal } from "@lit-labs/preact-signals";

/** Mirrors `navigator.onLine`, updated by the `online`/`offline` window events. */
export const isOnlineSignal = signal(navigator.onLine);

window.addEventListener("online", () => {
  isOnlineSignal.value = true;
});
window.addEventListener("offline", () => {
  isOnlineSignal.value = false;
});

/**
 * Runs `callback` once whenever the browser transitions from offline to
 * online - used to trigger a cloud-sync pull-and-merge on reconnect. Returns
 * an unsubscribe function.
 */
export const onReconnect = (callback: () => void): (() => void) => {
  const handleOnline = () => callback();
  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
};
