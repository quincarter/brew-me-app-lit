import { css } from "lit";

export const StatTileStyles = css`
  :host {
    display: block;
    flex: 1;
  }

  .tile {
    background: var(--brew-color-surface-container);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--brew-color-primary);
  }

  .value {
    font-size: 20px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .label {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }
`;
