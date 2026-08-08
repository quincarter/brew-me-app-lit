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

  .ratio-tips {
    background: var(--brew-color-surface-container-low);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ratio-tips-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--brew-color-on-surface-variant);
  }

  .ratio-tips-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ratio-tips-body {
    font-size: 14px;
    color: var(--brew-color-on-surface);
    line-height: 1.5;
    margin: 0;
  }
`;
