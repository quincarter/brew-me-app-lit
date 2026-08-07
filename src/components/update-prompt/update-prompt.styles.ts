import { css } from "lit";

export const UpdatePromptStyles = css`
  /*
   * No ":host(:empty)" rule - see the note in save-sheet.styles.ts. Not
   * needed here anyway: when render() returns nothing, the host has no
   * content and no fixed size, so it naturally doesn't intercept clicks
   * over the rest of the app - unlike the modal sheets, this is a
   * non-blocking snackbar with no scrim.
   */
  :host {
    position: fixed;
    left: 50%;
    bottom: 84px;
    transform: translateX(-50%);
    z-index: 40;
    display: block;
    width: max-content;
    max-width: calc(100% - 32px);
  }

  .toast {
    box-sizing: border-box;
    max-width: 360px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    row-gap: 8px;
    column-gap: 12px;
    padding: 12px 16px;
    border-radius: 16px;
    background: var(--brew-color-surface-container-high);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }

  .toast-text {
    flex: 1;
    min-width: 160px;
    font-size: 13px;
    color: var(--brew-color-on-surface);
  }

  .toast-actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  /* Above 840px the bottom tab bar becomes a left rail, so there's no bar to clear at the bottom anymore. */
  @media (min-width: 840px) {
    :host {
      bottom: 24px;
    }
  }
`;
