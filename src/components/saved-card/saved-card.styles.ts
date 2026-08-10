import { css } from "lit";

export const SavedCardStyles = css`
  :host {
    display: block;
  }

  .card {
    width: 100%;
    background: var(--brew-color-surface-container-low);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
  }

  .type {
    font-size: 14px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ratio {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail {
    font-size: 11px;
    color: var(--brew-color-on-surface-variant);
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .footer {
    display: flex;
    justify-content: space-between;
  }
`;
