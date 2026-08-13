import { css } from "lit";

export const AppShellStyles = css`
  /*
	 * The app fills the real viewport at every size - no phone-mockup card,
	 * no centering gutter. "100dvh" (with a "100vh" fallback for browsers
	 * that don't support it) avoids the classic mobile-browser issue where
	 * "100vh" is taller than what's actually visible under the address bar.
	 */
  :host {
    display: block;
    height: 100%;
    background: var(--brew-page-background);
    box-sizing: border-box;
    overflow: hidden;
    padding-top: env(safe-area-inset-top, 0px);
  }

  main {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* The router outlet renders the current screen as a direct child here - stretch it to fill the shell. */
  main > * {
    flex: 1;
    min-height: 0;
  }
`;
