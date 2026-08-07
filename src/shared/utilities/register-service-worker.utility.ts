import { registerSW } from "virtual:pwa-register";

/**
 * Registers the Workbox service worker that `vite-plugin-pwa` generates at
 * build time (and, via `devOptions.enabled` in `vite.config.ts`, in
 * `npm run dev` too). `registerType: "autoUpdate"` in the plugin config means
 * new versions activate silently in the background - no "reload to update"
 * prompt to build here, just a console note so it's visible while developing.
 */
export const registerServiceWorker = (): void => {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info("[BrewMe] Ready to work offline.");
    },
    onRegisterError(error) {
      console.error("[BrewMe] Service worker registration failed.", error);
    },
  });
};
