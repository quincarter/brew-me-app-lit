import { css } from "lit";

export const IconButtonStyles = css`
  :host {
    display: inline-flex;
  }

  .btn {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    color: var(--brew-color-on-surface-variant);
    transition: background-color 0.15s ease;
  }

  .btn:hover {
    background: color-mix(in srgb, currentColor 8%, transparent);
  }

  .btn:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .btn.filled {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
  }

  .btn.fab {
    width: 72px;
    height: 72px;
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
`;
