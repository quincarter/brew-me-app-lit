import { registerSW } from "virtual:pwa-register";

type ServiceWorkerUpdater = (reloadPage?: boolean) => Promise<void>;

let updateServiceWorker: ServiceWorkerUpdater | null = null;

/**
 * Registers the Workbox service worker that `vite-plugin-pwa` generates at
 * build time (and, via `devOptions.enabled` in `vite.config.ts`, in
 * `npm run dev` too). `registerType: "autoUpdate"` in the plugin config means
 * new versions activate silently in the background - no "reload to update"
 * prompt to build here, just a console note so it's visible while developing.
 */
export const registerServiceWorker = (): void => {
  updateServiceWorker = registerSW({
    immediate: true,
    onOfflineReady() {
      console.info("[BrewMe] Ready to work offline.");
    },
    onRegisterError(error) {
      console.error("[BrewMe] Service worker registration failed.", error);
    },
  });
};

/**
 * Manual fallback for the Settings screen's "Refresh app" button, for the
 * rare case `autoUpdate` hasn't picked up a new deploy on its own yet (e.g.
 * the tab's been open for a long time). Forces a check for a new service
 * worker version - which activates and reloads if one is found - and always
 * reloads the page regardless, so the button feels like it did something
 * even when there was nothing new to fetch.
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
