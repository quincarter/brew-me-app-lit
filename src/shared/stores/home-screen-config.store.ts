import { computed } from "@lit-labs/preact-signals";
import type {
  HomeScreenSectionId,
  IHomeScreenSectionConfig,
} from "../interfaces/home-screen-config.interface";
import { isAnyCloudProviderConfigured } from "../utilities/cloud-provider-config.utility";
import { moveItem } from "../utilities/reorder.utility";
import { isWebBluetoothSupported } from "../utilities/web-bluetooth.utility";
import { persistentSignal } from "./persistent-signal";

/** Display order/state the app ships with - matches Home's original hardcoded layout. */
const DEFAULT_SECTION_ORDER: HomeScreenSectionId[] = [
  "brewAgain",
  "quickActions",
  "devices",
  "cloudSync",
  "stats",
  "recentBrews",
  "support",
];

const DEFAULT_CONFIG: IHomeScreenSectionConfig[] = DEFAULT_SECTION_ORDER.map((id) => ({
  id,
  visible: true,
}));

/** Title/description shown for each section on the Home Screen Configurator screen. */
export const HOME_SCREEN_SECTION_LABELS: Record<
  HomeScreenSectionId,
  { title: string; description: string }
> = {
  brewAgain: {
    title: "Brew again",
    description: "Quick-repeat card for your most recently brewed recipe",
  },
  quickActions: {
    title: "Quick actions",
    description: "Calculate, Saved Brews, and Timer shortcuts",
  },
  devices: {
    title: "Devices",
    description: "Shortcut to connect a Bluetooth scale",
  },
  cloudSync: {
    title: "Cloud Sync",
    description: "Cloud backup status shortcut",
  },
  stats: {
    title: "Stats",
    description: "Saved brew count and day streak",
  },
  recentBrews: {
    title: "Recent brews",
    description: "Your most recently saved brews",
  },
  support: {
    title: "Support BrewMe",
    description: "Support card at the bottom of Home",
  },
};

/**
 * Order + show/hide state for Home screen's cards, in display order.
 * Persisted to IndexedDB via the same `persistentSignal` pattern as
 * `timerCountStyleSignal` - defaults to every section visible in Home's
 * original hardcoded order.
 */
export const homeScreenConfigSignal = persistentSignal<IHomeScreenSectionConfig[]>(DEFAULT_CONFIG, {
  key: "home-screen-config",
});

/**
 * Whether `id` can be shown on Home at all right now, independent of its
 * persisted `visible` flag - `devices` needs Web Bluetooth (desktop/Android
 * Chromium only, same check Home's own tile and Settings' "Connected
 * devices" section already use), `cloudSync` needs at least one cloud
 * provider configured for this build (same check Home's Cloud Sync tile
 * and Settings' Cloud Sync row already use). Every other section has no
 * such dependency. The configurator screen uses this to hide the toggle
 * entirely rather than show a switch that can't do anything - honoring the
 * same progressive-enhancement gate everywhere this app already applies it.
 */
export function isHomeScreenSectionAvailable(id: HomeScreenSectionId): boolean {
  if (id === "devices") return isWebBluetoothSupported();
  if (id === "cloudSync") return isAnyCloudProviderConfigured();
  return true;
}

/**
 * Drops any persisted entry whose id is no longer recognized and appends
 * any known section missing from the persisted array (e.g. a fresh
 * install's yet-to-load default, or a future section added after this
 * config was first saved) at the end, defaulted to visible. Applied before
 * every read/write below so callers never have to special-case a
 * stale/incomplete persisted array themselves.
 */
function normalize(config: IHomeScreenSectionConfig[]): IHomeScreenSectionConfig[] {
  const known = new Set<HomeScreenSectionId>(DEFAULT_SECTION_ORDER);
  const seen = new Set<HomeScreenSectionId>();
  const kept = config.filter((entry) => {
    if (!known.has(entry.id) || seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !seen.has(id)).map((id) => ({
    id,
    visible: true,
  }));
  return [...kept, ...missing];
}

/** Every known section, in display order, normalized. */
export const orderedHomeScreenConfigSignal = computed(() =>
  normalize(homeScreenConfigSignal.value),
);

/**
 * Available sections only (see `isHomeScreenSectionAvailable`), in display
 * order, `visible` flag intact - what the configurator screen renders rows
 * for. Deliberately keeps hidden-but-available sections (so a switched-off
 * section can still be found and switched back on) while dropping
 * unavailable ones entirely, rather than showing a toggle that can't do
 * anything on this browser/build. A plain function for the same reason as
 * `getVisibleHomeScreenSections` above.
 */
export function getAvailableHomeScreenConfig(): IHomeScreenSectionConfig[] {
  return orderedHomeScreenConfigSignal.value.filter((entry) =>
    isHomeScreenSectionAvailable(entry.id),
  );
}

/**
 * Ids of sections that should actually render on Home right now: visible
 * and available (see `isHomeScreenSectionAvailable`), in display order. A
 * plain function rather than a `computed` - `isHomeScreenSectionAvailable`
 * reads non-signal state (`navigator.bluetooth`, `import.meta.env`), so a
 * `computed` would cache a stale result across a change in that state
 * alone (matching why `isAnyCloudProviderConfigured` is a plain function
 * too). Call this from a `SignalWatcher` render - reading
 * `homeScreenConfigSignal.value` here still subscribes the component to
 * config changes the normal way.
 */
export function getVisibleHomeScreenSections(): HomeScreenSectionId[] {
  return orderedHomeScreenConfigSignal.value
    .filter((entry) => entry.visible && isHomeScreenSectionAvailable(entry.id))
    .map((entry) => entry.id);
}

export function setHomeScreenSectionVisible(id: HomeScreenSectionId, visible: boolean): void {
  homeScreenConfigSignal.value = normalize(homeScreenConfigSignal.value).map((entry) =>
    entry.id === id ? { ...entry, visible } : entry,
  );
}

/**
 * Moves `id` one position earlier/later among *available* sections (see
 * `isHomeScreenSectionAvailable`) - a no-op at either boundary. An
 * unavailable section (e.g. `devices` on a browser without Web Bluetooth)
 * still occupies a slot in the persisted array but is never shown in the
 * configurator, so a plain index swap against the adjacent slot could land
 * on one of those and appear to do nothing; this walks past any
 * unavailable slots in the requested direction to find the next one that's
 * actually visible in the UI before moving.
 */
export function moveHomeScreenSection(id: HomeScreenSectionId, direction: "up" | "down"): void {
  const config = normalize(homeScreenConfigSignal.value);
  const fromIndex = config.findIndex((entry) => entry.id === id);
  if (fromIndex === -1) return;

  const step = direction === "up" ? -1 : 1;
  let toIndex = fromIndex + step;
  while (
    toIndex >= 0 &&
    toIndex < config.length &&
    !isHomeScreenSectionAvailable(config[toIndex].id)
  ) {
    toIndex += step;
  }
  if (toIndex < 0 || toIndex >= config.length) return;

  homeScreenConfigSignal.value = moveItem(config, fromIndex, toIndex);
}

/** Restores Home's original section order and shows every section again. */
export function resetHomeScreenConfig(): void {
  homeScreenConfigSignal.value = DEFAULT_CONFIG;
}
