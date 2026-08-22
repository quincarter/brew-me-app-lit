import { signal } from "@lit-labs/preact-signals";

const THEME_KEY = "theme";

/**
 * Shared dark-mode state, so the floating `brew-theme-toggle` and the
 * Settings screen's dark-mode switch always reflect the same value and stay
 * in sync with each other. Seeded from the `data-theme` attribute that
 * `detectColorScheme` (`detect-color-scheme.utility.ts`) already applied
 * pre-render, not re-derived from `localStorage` directly, so there's
 * exactly one source of truth for "what theme is currently applied."
 */
export const isDarkThemeSignal = signal(
  document.documentElement.getAttribute("data-theme") === "dark",
);

export const setDarkTheme = (isDark: boolean): void => {
  isDarkThemeSignal.value = isDark;
  if (isDark) {
    localStorage.setItem(THEME_KEY, "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    localStorage.setItem(THEME_KEY, "light");
    document.documentElement.removeAttribute("data-theme");
  }
};

export const toggleDarkTheme = (): void => setDarkTheme(!isDarkThemeSignal.value);
