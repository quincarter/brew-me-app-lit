import { css } from "lit";

export const ListRowStyles = css`
  :host {
    display: block;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 0;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
  }

  .icon-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .headline {
    font-size: 16px;
    color: var(--brew-color-on-surface);
  }

  .supporting {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    margin-top: 2px;
  }

  .text brew-star-rating {
    margin-top: 4px;
  }

  brew-icon.chevron {
    color: var(--brew-color-on-surface-variant);
    flex-shrink: 0;
  }

  brew-icon-button {
    flex-shrink: 0;
  }
`;
