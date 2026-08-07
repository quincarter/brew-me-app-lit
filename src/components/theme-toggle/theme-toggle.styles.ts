import { css } from "lit";

export const ThemeToggleStyles = css`
  :host {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
  }

  button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    background: var(--brew-color-surface-container-high);
    color: var(--brew-color-on-surface);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  }

  button:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }
`;
