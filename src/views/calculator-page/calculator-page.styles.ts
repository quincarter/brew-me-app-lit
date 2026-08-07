import { css } from "lit";

export const CalculatorPageStyles = css`
  :host {
    display: block;
    height: 100%;
    position: relative;
  }

  .screen {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content {
    padding: 8px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    flex: 1;
    min-height: 0;
    overflow: auto;
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

  .tips {
    border-top: 1px solid var(--brew-color-outline-variant);
    padding-top: 14px;
    margin-top: 4px;
  }

  .tips-toggle {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    width: 100%;
    color: var(--brew-color-on-surface-variant);
  }

  .tips-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .tips-body {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    line-height: 1.6;
    padding: 10px 0 0 28px;
    margin: 0;
  }
`;
