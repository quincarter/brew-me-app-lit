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

  .row {
    display: flex;
    gap: 12px;
  }

  .row > * {
    flex: 1;
  }

  .share-status {
    margin: -8px 0 0;
    text-align: center;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
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
