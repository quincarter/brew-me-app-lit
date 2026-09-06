import { css } from "lit";

export const CloudSyncProviderRowStyles = css`
  :host {
    display: block;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
  }

  .row-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .headline {
    font-size: 16px;
    color: var(--brew-color-on-surface);
  }

  .supporting {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .supporting.error {
    color: var(--brew-color-error);
  }

  .note {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
    opacity: 0.8;
  }

  :host([disabled]) .headline,
  :host([disabled]) .supporting {
    opacity: 0.6;
  }
`;
