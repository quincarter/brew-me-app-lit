import { css } from "lit";

export const RatioFormStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .hint {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
    line-height: 1.5;
    margin: -10px 0 0;
  }

  .row {
    display: flex;
    gap: 12px;
  }

  .row > * {
    flex: 1;
  }

  .result {
    background: var(--brew-color-primary-container);
    border-radius: 24px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .result-label {
    font-size: 12px;
    color: var(--brew-color-on-primary-container);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .result-value {
    font-size: 44px;
    font-weight: 600;
    color: var(--brew-color-on-primary-container);
  }
`;
