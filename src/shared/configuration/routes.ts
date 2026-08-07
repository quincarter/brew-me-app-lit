export interface IRouteConfig {
  name: string;
  path: string;
  tagName: string;
  directory: string;
  fileName: string;
}

/**
 * BrewMe's fixed screen map. Unlike app-shell-starter's `nav.ts` /
 * `routes.ts`, there's no access control or nav-bar generation here -
 * every screen is public and navigation is handled by `brew-bottom-nav`
 * and `brew-top-bar` instead of a shared header.
 */
export const routes: IRouteConfig[] = [
  { name: "Home", path: "/", tagName: "home-page", directory: "home-page", fileName: "home-page" },
  {
    name: "Calculator",
    path: "/calculate",
    tagName: "calculator-page",
    directory: "calculator-page",
    fileName: "calculator-page",
  },
  {
    name: "Saved Brews",
    path: "/saved",
    tagName: "saved-page",
    directory: "saved-page",
    fileName: "saved-page",
  },
  {
    name: "Saved Ratio Detail",
    path: "/saved/:id",
    tagName: "saved-detail-page",
    directory: "saved-detail-page",
    fileName: "saved-detail-page",
  },
  {
    name: "More",
    path: "/more",
    tagName: "more-page",
    directory: "more-page",
    fileName: "more-page",
  },
  {
    name: "Pour-over Timer",
    path: "/timer",
    tagName: "timer-page",
    directory: "timer-page",
    fileName: "timer-page",
  },
  {
    name: "WAC Recipes",
    path: "/more/aeropress-recipes",
    tagName: "aeropress-recipes-page",
    directory: "aeropress-recipes-page",
    fileName: "aeropress-recipes-page",
  },
  {
    name: "Brew Guide",
    path: "/more/guide/:id",
    tagName: "guide-detail-page",
    directory: "guide-detail-page",
    fileName: "guide-detail-page",
  },
  {
    name: "Settings",
    path: "/more/settings",
    tagName: "settings-page",
    directory: "settings-page",
    fileName: "settings-page",
  },
];
