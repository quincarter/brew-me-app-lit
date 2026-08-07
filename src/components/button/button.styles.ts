import { css } from "lit";

export const ButtonStyles = css`
  :host {
    display: inline-block;
  }

  .btn {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0 24px;
    border-radius: 20px;
    border: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    text-decoration: none;
    box-sizing: border-box;
    transition:
      background-color 0.15s ease,
      opacity 0.15s ease;
  }

  .btn.full-width {
    width: 100%;
  }

  .btn.filled {
    background: var(--brew-color-primary);
    color: var(--brew-color-on-primary);
  }

  .btn.outlined {
    background: transparent;
    color: var(--brew-color-primary);
    border: 1px solid var(--brew-color-outline);
  }

  .btn.text {
    background: transparent;
    color: var(--brew-color-primary);
    padding: 0 12px;
  }

  .btn.filled.danger {
    background: var(--brew-color-error);
    color: var(--brew-color-on-error);
  }

  .btn.outlined.danger {
    color: var(--brew-color-error);
    border-color: var(--brew-color-error);
  }

  .btn.text.danger {
    color: var(--brew-color-error);
  }

  .btn[disabled] {
    opacity: 0.38;
    cursor: not-allowed;
    pointer-events: none;
  }

  .btn:not([disabled]):hover {
    opacity: 0.92;
  }

  .btn:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }
`;
