/**
 * The set of independently orderable/hideable cards on the Home screen.
 * `devices` and `cloudSync` are also gated on runtime/build availability
 * (see `isHomeScreenSectionAvailable` in `home-screen-config.store.ts`) -
 * they're never offered as configurable at all on a browser/build that
 * can't show them, matching the same progressive-enhancement gate Home and
 * Settings already apply to those two tiles.
 */
export type HomeScreenSectionId =
  | "brewAgain"
  | "quickActions"
  | "devices"
  | "cloudSync"
  | "stats"
  | "recentBrews"
  | "support";

/** One section's persisted state - its `visible` flag, at its position in the persisted array (array order is display order). */
export interface IHomeScreenSectionConfig {
  id: HomeScreenSectionId;
  visible: boolean;
}
