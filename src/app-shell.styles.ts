import { css } from "lit";

export const AppShellStyles = css`
  /*
	 * The app fills the real viewport at every size - no phone-mockup card,
	 * no centering gutter. "100dvh" (with a "100vh" fallback for browsers
	 * that don't support it) avoids the classic mobile-browser issue where
	 * "100vh" is taller than what's actually visible under the address bar.
	 */
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    height: 100vh;
    height: 100dvh;
    background: var(--brew-page-background);
    box-sizing: border-box;
    overflow: hidden;
  }

  @media (display-mode: standalone) {
    :host {
      height: 100% !important;
      height: 100vh !important;
    }
  }

  :host-context(html[data-standalone="true"]) {
    height: 100% !important;
    height: 100vh !important;
  }

  main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* The router outlet renders the current screen as a direct child here - stretch it to fill the shell. */
  main > * {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
`;
