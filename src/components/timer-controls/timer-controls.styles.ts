import { css } from "lit";

export const TimerControlsStyles = css`
  /* Same reasoning as timer-recipe-panel.styles.ts: this component renders
   * no wrapping box of its own, so .idle-actions (or .controls + .hint)
   * become direct flex items of the page's ".content" column. */
  :host {
    display: contents;
  }

  .controls {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .idle-actions {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .spacer {
    width: 48px;
    display: inline-block;
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
