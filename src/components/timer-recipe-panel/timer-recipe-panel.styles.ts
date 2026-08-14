import { css } from "lit";

export const TimerRecipePanelStyles = css`
  /* This component only groups related Timer-page markup - it renders no
   * wrapping box of its own, so its top-level nodes (.recipe-caption,
   * .guided-options, the optional brew-steps-card) become direct flex
   * items of the page's ".content" column, preserving that layout's
   * gap/alignment exactly as if they were still inlined in the page. */
  :host {
    display: contents;
  }

  .recipe-caption {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: center;
  }

  .recipe-caption-name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--brew-color-on-surface);
  }

  .recipe-caption-detail {
    margin: 0;
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .guided-options {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .mode-toggle-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mode-toggle {
    display: flex;
    gap: 8px;
  }

  .target-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid var(--brew-color-outline-variant);
    border-radius: 16px;
    background: var(--brew-color-surface-container-low);
    color: var(--brew-color-on-surface-variant);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .target-chip:hover {
    background: var(--brew-color-surface-container);
    border-color: var(--brew-color-outline);
    color: var(--brew-color-on-surface);
  }

  .target-chip:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .target-edit-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 280px;
  }

  .target-edit-bar brew-text-field {
    flex: 1;
  }
`;
