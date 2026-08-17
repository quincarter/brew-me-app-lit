import { css } from "lit";

export const ChipStyles = css`
  :host {
    display: inline-flex;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    border-radius: 16px;
    border: 1px solid var(--brew-color-outline-variant);
    background: transparent;
    color: var(--brew-color-on-surface-variant);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .chip.selected {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
    border-color: transparent;
  }

  .chip:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .chip[disabled] {
    opacity: 0.38;
    cursor: not-allowed;
    pointer-events: none;
  }
`;
