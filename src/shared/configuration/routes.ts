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
    name: "AeroPress Recipes",
    path: "/more/aeropress-recipes",
    tagName: "aeropress-recipes-page",
    directory: "aeropress-recipes-page",
    fileName: "aeropress-recipes-page",
  },
  {
    name: "V60 Recipes",
    path: "/more/v60-recipes",
    tagName: "v60-recipes-page",
    directory: "v60-recipes-page",
    fileName: "v60-recipes-page",
  },
  {
    name: "Origami Recipes",
    path: "/more/origami-recipes",
    tagName: "origami-recipes-page",
    directory: "origami-recipes-page",
    fileName: "origami-recipes-page",
  },
  {
    name: "Kalita Wave Recipes",
    path: "/more/kalita-wave-recipes",
    tagName: "kalita-wave-recipes-page",
    directory: "kalita-wave-recipes-page",
    fileName: "kalita-wave-recipes-page",
  },
  {
    name: "Chemex Recipes",
    path: "/more/chemex-recipes",
    tagName: "chemex-recipes-page",
    directory: "chemex-recipes-page",
    fileName: "chemex-recipes-page",
  },
  {
    name: "Clever Dripper Recipes",
    path: "/more/clever-dripper-recipes",
    tagName: "clever-dripper-recipes-page",
    directory: "clever-dripper-recipes-page",
    fileName: "clever-dripper-recipes-page",
  },
  {
    name: "Hario Switch Recipes",
    path: "/more/hario-switch-recipes",
    tagName: "hario-switch-recipes-page",
    directory: "hario-switch-recipes-page",
    fileName: "hario-switch-recipes-page",
  },
  {
    name: "Espresso Recipes",
    path: "/more/espresso-recipes",
    tagName: "espresso-recipes-page",
    directory: "espresso-recipes-page",
    fileName: "espresso-recipes-page",
  },
  {
    name: "World Barista Championship",
    path: "/more/wbc-videos",
    tagName: "wbc-videos-page",
    directory: "wbc-videos-page",
    fileName: "wbc-videos-page",
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
  {
    name: "Shared Brew",
    path: "/share",
    tagName: "brew-share-page",
    directory: "brew-share-page",
    fileName: "brew-share-page",
  },
];
