/**
 * Mirrors app-shell-starter's pre-render theme detection, now run as the
 * first side effect of the app bundle (see `app-shell.ts`) instead of a
 * separate unbundled `<script>` in `index.html`, so it still runs before
 * `AppShell` renders but ships as a cached, hashed asset like the rest of
 * the app. A stored preference wins over the OS setting; with neither, the
 * app stays on the light-theme default.
 */
export const detectColorScheme = (): void => {
  const storedTheme = localStorage.getItem("theme");
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark = storedTheme ? storedTheme === "dark" : prefersDark;

  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
};

// Self-invoked at module-evaluation time (not called from `app-shell.ts`'s
// own body) so this is guaranteed to run before other imported modules -
// e.g. `theme.store.ts`, which reads `data-theme` at its own module top
// level to seed `isDarkThemeSignal` - as long as this module is the first
// import in `app-shell.ts`. A module's own top-level statements only run
// after every one of its imports has finished evaluating, so a call placed
// in `app-shell.ts` itself would always run after ALL of its imports
// (including ones transitively depending on the theme already being
// applied), regardless of where that call sits relative to the import
// lines.
detectColorScheme();
