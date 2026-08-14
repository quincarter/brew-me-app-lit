import { css } from "lit";

export const BottomNavStyles = css`
  :host {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 30;
    display: block;
    width: 100%;
  }

  .nav {
    display: flex;
    background: var(--brew-color-surface-container);
    padding: 8px 0 calc(12px + env(safe-area-inset-bottom, 0px));
  }

  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    color: var(--brew-color-on-surface-variant);
    cursor: pointer;
  }

  .icon-wrap {
    display: inline-flex;
    color: var(--brew-color-on-surface-variant);
  }

  .icon-wrap.active {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
    border-radius: 16px;
    padding: 4px 20px;
  }

  .label {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .label.active {
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  /*
	 * Expanded (tablet/desktop) widths: same markup, but laid out as a fixed
	 * left navigation rail instead of a bottom tab bar - the Material 3
	 * "compact vs. expanded" window size pattern. Keep "840"/"88" in sync
	 * with src/shared/styles/responsive.styles.ts.
	 */
  @media (min-width: 840px) {
    :host {
      position: fixed;
      inset-block: 0;
      left: 0;
      width: 88px;
      z-index: 30;
    }

    .nav {
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      height: 100%;
      padding: 28px 0;
      gap: 12px;
    }

    .tab {
      flex: 0 0 auto;
    }
  }
`;
