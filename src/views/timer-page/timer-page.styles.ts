import { css } from "lit";

export const TimerPageStyles = css`
  :host {
    display: block;
    height: 100%;
  }

  .screen {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 20px;
  }

  .dial {
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: var(--brew-color-primary-container);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .dial-label {
    font-size: 12px;
    color: var(--brew-color-on-primary-container);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .dial-value {
    font-size: 48px;
    font-weight: 600;
    color: var(--brew-color-on-primary-container);
  }

  .controls {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .spacer {
    width: 48px;
    display: inline-block;
  }

  .hint {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    text-align: center;
    margin: 0;
  }
`;
