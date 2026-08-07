import { css } from "lit";

export const ActionTileStyles = css`
  :host {
    display: block;
    flex: 1;
  }

  .tile {
    box-sizing: border-box;
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: pointer;
    text-decoration: none;
    height: 100%;
    justify-content: space-between;
  }

  .tile.primary {
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
  }

  .tile.secondary {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
  }

  .tile.tertiary {
    background: var(--brew-color-tertiary-container);
    color: var(--brew-color-on-tertiary-container);
  }

  .label {
    font-size: 14px;
    font-weight: 500;
  }
`;
