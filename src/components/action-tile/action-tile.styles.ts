import { css } from "lit";

export const ActionTileStyles = css`
  :host {
    display: block;
    flex: 1;
  }

  .tile {
    box-sizing: border-box;
    width: 100%;
    border: none;
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: pointer;
    text-decoration: none;
    text-align: left;
    font: inherit;
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

  /* Deliberately muted/neutral rather than one of the three brand-color containers above -
   * for a tile that isn't a core brewing action (e.g. Home's "Devices" tile), so it doesn't
   * visually compete with Calculate/Saved Brews/Timer or the "Brew again" card. */
  .tile.neutral {
    background: var(--brew-color-surface-container);
    color: var(--brew-color-on-surface);
  }

  .label {
    font-size: 14px;
    font-weight: 500;
  }
`;
