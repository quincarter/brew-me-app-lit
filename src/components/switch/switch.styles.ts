import { css } from "lit";

export const SwitchStyles = css`
  :host {
    display: inline-flex;
  }

  .track {
    all: unset;
    box-sizing: border-box;
    position: relative;
    width: 44px;
    height: 26px;
    border-radius: 13px;
    background: var(--brew-color-surface-container-highest);
    border: 2px solid var(--brew-color-outline);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
    flex-shrink: 0;
  }

  .track.checked {
    background: var(--brew-color-primary);
    border-color: var(--brew-color-primary);
  }

  .thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--brew-color-outline);
    transition:
      transform 0.15s ease,
      background-color 0.15s ease;
  }

  .track.checked .thumb {
    background: var(--brew-color-on-primary);
    transform: translateX(18px);
  }

  .track:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }
`;
