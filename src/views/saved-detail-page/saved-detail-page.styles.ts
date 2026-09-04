import { css } from "lit";

export const SavedDetailPageStyles = css`
  :host {
    display: block;
    height: 100%;
  }

  .screen {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content {
    padding: 8px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .rating {
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--brew-color-on-surface-variant);
  }

  .tasting-note {
    margin: 0;
    font-size: 14px;
    font-style: italic;
    color: var(--brew-color-on-surface-variant);
  }

  .action-row {
    display: flex;
    gap: 10px;
    justify-content: space-evenly;
  }

  .section-title {
    margin: 4px 0 -8px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--brew-color-on-surface-variant);
  }

  .share-status {
    margin: -6px 0 0;
    text-align: center;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  .primed-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--brew-color-primary);
    border-radius: 14px;
    padding: 10px 14px;
    background: var(--brew-color-surface-container-high);
    color: var(--brew-color-primary);
  }

  .primed-banner-text {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  button.primed-banner.recipe-banner {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    cursor: pointer;
    border: 1px solid var(--brew-color-primary);
    border-radius: 14px;
    padding: 10px 14px;
    background: var(--brew-color-surface-container-high);
    color: var(--brew-color-primary);
  }

  button.primed-banner.recipe-banner:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .title {
    font-size: 20px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .hint {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
`;
