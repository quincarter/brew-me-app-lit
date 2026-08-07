import { css } from "lit";

export const TextFieldStyles = css`
  :host {
    display: block;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    font-size: 12px;
    font-weight: 500;
    color: var(--brew-color-on-surface-variant);
  }

  .control {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--brew-color-outline);
    border-radius: 12px;
    padding: 0 14px;
    background: var(--brew-color-surface-container-lowest);
    transition: border-color 0.15s ease;
  }

  .control:focus-within {
    border-color: var(--brew-color-primary);
    border-width: 2px;
    padding: 0 13px;
  }

  .input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 16px;
    color: var(--brew-color-on-surface);
    height: 48px;
    padding: 0;
  }

  .suffix {
    font-size: 14px;
    color: var(--brew-color-on-surface-variant);
  }
`;
