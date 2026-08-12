/// <reference types="vitest" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [
    VitePWA({
      // "prompt" (rather than "autoUpdate") means a new service worker
      // installs but waits instead of activating itself - `onNeedRefresh`
      // in register-service-worker.utility.ts fires so `brew-update-prompt`
      // can ask before swapping in new code, instead of silently updating
      // out from under someone mid-brew.
      registerType: "prompt",
      // We render our own install UI (`brew-install-prompt`) and update UI
      // (`brew-update-prompt`), so skip the plugin's default injected
      // toasts and let `virtual:pwa-register` drive the service worker
      // instead.
      injectRegister: null,
      workbox: {
        // Precache the full app shell (JS/CSS/HTML + every icon we ship)
        // so the app keeps working with zero network access after the
        // first load.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/assets/],
        runtimeCaching: [
          {
            // Google Fonts stylesheet - revalidate opportunistically,
            // fall back to cache offline.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "brew-google-fonts-stylesheets" },
          },
          {
            // Actual font files rarely change once fetched - cache
            // them long-term so they're available offline.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "brew-google-fonts-webfonts",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 30 },
            },
          },
        ],
      },
      manifest: {
        id: "/",
        name: "BrewMe",
        short_name: "BrewMe",
        description:
          "A coffee water:coffee ratio calculator, pour-over timer, and brew method guide.",
        theme_color: "#8b5000",
        background_color: "#efeae3",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        // Chrome/Edge (desktop 139+, and Android via the WebAPK an install
        // creates) already capture in-scope links into an installed PWA
        // automatically - no manifest opt-in field for that part exists
        // anymore (the old "capture_links" field never shipped and was
        // dropped in 2022; capturing itself is a browser/OS setting, not
        // something a manifest field turns on). `launch_handler` is the one
        // piece of that behavior actually left to the app: once a link is
        // captured, it decides whether to reuse the existing app window
        // instead of always popping a new one. Not supported on iOS - a
        // home-screen web app there is a WebClip, not a WebAPK/native
        // install, and Safari has no equivalent capturing mechanism.
        launch_handler: {
          client_mode: "navigate-existing",
        },
        icons: [
          { src: "icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
          { src: "icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
          {
            src: "icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // Rendered by Chrome/Edge's own richer install dialog on top of our
        // custom `brew-install-prompt` bottom sheet - same two screens.
        screenshots: [
          {
            src: "screenshots/home.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Home screen",
          },
          {
            src: "screenshots/calculator.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Ratio calculator",
          },
          {
            src: "screenshots/timer.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Pour-over timer",
          },
          {
            src: "screenshots/saved.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Saved brews",
          },
          {
            src: "screenshots/guide-detail.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Brew guide detail",
          },
          {
            src: "screenshots/v60-recipes.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "V60 recipes",
          },
          {
            src: "screenshots/aeropress-recipes.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "AeroPress recipes",
          },
          {
            src: "screenshots/more.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "More menu",
          },
          {
            src: "screenshots/settings.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Settings",
          },
          {
            src: "screenshots/home-with-data.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Home screen (with saved brews)",
          },
          {
            src: "screenshots/saved-with-data.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Saved brews (populated)",
          },
          {
            src: "screenshots/timer-with-recipe.png",
            sizes: "824x1830",
            type: "image/png",
            form_factor: "narrow",
            label: "Guided timer with recipe",
          },
        ],
      },
      devOptions: {
        // Lets `npm run dev` register a real service worker too, so
        // offline behavior can be checked without a production build.
        enabled: true,
        type: "module",
      },
    }),
  ],
  build: {
    assetsDir: "src",
    cssMinify: true,
  },
  test: {
    environment: "happy-dom",
    // `e2e/**` holds Playwright specs (`test.describe`), run via `npm run
    // test:e2e` - without this they'd also match Vitest's default test glob
    // and fail to even load under the wrong test runner.
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      exclude: [
        "**/node_modules",
        "**/vite.config.*",
        "**/vite-env.d.ts",
        "**/shared/data/**",
      ],
      enabled: true,
    },
  },
});
