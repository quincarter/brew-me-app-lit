import { signal } from "@lit-labs/preact-signals";
import { registerSW } from "virtual:pwa-register";

type ServiceWorkerUpdater = (reloadPage?: boolean) => Promise<void>;

let updateServiceWorker: ServiceWorkerUpdater | null = null;

/** True once a new service worker has installed and is waiting to activate. Drives `brew-update-prompt`. */
export const needsRefreshSignal = signal(false);

/**
 * True once the app shell's asset inventory is confirmed cached and the app
 * is genuinely usable offline. `install-prompt.store.ts` gates
 * `canShowInstallPromptSignal` on this so people aren't invited to install a
 * PWA that can't yet back up its "works offline" pitch. Seeded from
 * `navigator.serviceWorker.controller` for returning visits, where
 * precaching already completed in a prior session and Workbox's
 * `onOfflineReady` (below) - which only fires once, the first time this
 * build's precache finishes - won't fire again this load. Intentionally
 * stays false (and so keeps the install prompt hidden) if registration
 * never succeeds - see `onRegisterError` below - since a broken
 * registration means the app genuinely isn't installable/offline-capable
 * yet.
 */
export const isOfflineReadySignal = signal(Boolean(navigator.serviceWorker?.controller));

/**
 * Registers the Workbox service worker that `vite-plugin-pwa` generates at
 * build time (and, via `devOptions.enabled` in `vite.config.ts`, in
 * `npm run dev` too). `registerType: "prompt"` in the plugin config means a
 * new version installs but waits rather than swapping itself in silently -
 * `onNeedRefresh` flips `needsRefreshSignal`, which `brew-update-prompt`
 * (mounted in `app-shell.ts`) watches to show a "new version available"
 * banner.
 */
export const registerServiceWorker = (): void => {
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      needsRefreshSignal.value = true;
    },
    onOfflineReady() {
      isOfflineReadySignal.value = true;
      console.info("[BrewMe] Ready to work offline.");
    },
    onRegisterError(error) {
      console.error("[BrewMe] Service worker registration failed.", error);
    },
  });
};

/**
 * Activates the waiting service worker `brew-update-prompt` detected and
 * reloads once it takes control. Only meaningful while `needsRefreshSignal`
 * is true.
 */
export const applyUpdate = async (): Promise<void> => {
  if (updateServiceWorker) {
    await updateServiceWorker(true);
  }
  needsRefreshSignal.value = false;
};

/** Dismisses the banner without updating - the prompt reappears on the next visit if the update's still pending. */
export const dismissUpdatePrompt = (): void => {
  needsRefreshSignal.value = false;
};

/**
 * Manual fallback for the Settings screen's "Refresh app" button, for the
 * rare case a new version hasn't been detected yet (e.g. the tab's been
 * open for a long time and hasn't re-checked). Forces a check for a new
 * service worker version - which activates and reloads if one is found -
 * and always reloads the page regardless, so the button feels like it did
 * something even when there was nothing new to fetch.
 */
export const refreshApp = async (): Promise<void> => {
  try {
    if (updateServiceWorker) {
      await updateServiceWorker(true);
    }
  } finally {
    window.location.reload();
  }
};
