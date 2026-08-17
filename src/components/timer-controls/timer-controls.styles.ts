import { css } from "lit";

export const TimerControlsStyles = css`
  /* Same reasoning as timer-recipe-panel.styles.ts: this component renders
   * no wrapping box of its own, so .idle-actions becomes a direct flex item
   * of the page's ".content" column. */
  :host {
    display: contents;
  }

  .idle-actions {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .hint {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    text-align: center;
    margin: 0;
  }

  .hint a {
    color: var(--brew-color-primary);
    font-weight: 600;
    text-decoration: none;
  }

  .hint a:hover,
  .hint a:focus-visible {
    text-decoration: underline;
  }
`;
