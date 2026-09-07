import { css } from "lit";

export const HomeScreenConfigRowStyles = css`
  :host {
    display: block;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
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
  }

  .row-controls {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .move-btn {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    color: var(--brew-color-on-surface-variant);
    transition: background-color 0.15s ease;
  }

  .move-btn:hover:not(:disabled) {
    background: color-mix(in srgb, currentColor 8%, transparent);
  }

  .move-btn:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .move-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  brew-switch {
    margin-left: 8px;
  }
`;
