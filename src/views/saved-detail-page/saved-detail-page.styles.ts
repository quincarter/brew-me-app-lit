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
`;
