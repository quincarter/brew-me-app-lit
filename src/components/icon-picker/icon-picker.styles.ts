import { css } from "lit";

export const IconPickerStyles = css`
  :host {
    display: block;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    gap: 12px;
  }

  .icon-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    border: 1px solid var(--brew-color-outline-variant);
    border-radius: 16px;
    background: transparent;
    color: var(--brew-color-on-surface-variant);
    font-family: inherit;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .icon-option.selected {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
    border-color: transparent;
  }

  .icon-option:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .icon {
    display: inline-flex;
    width: 24px;
    height: 24px;
  }

  .icon svg {
    width: 100%;
    height: 100%;
  }

  .label {
    font-size: 10px;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
  }
`;
