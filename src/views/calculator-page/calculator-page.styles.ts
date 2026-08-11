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

  .primed-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--brew-color-primary);
    border-radius: 14px;
    padding: 10px 14px;
    background: var(--brew-color-surface-container-high);
    color: var(--brew-color-primary);
  }

  .primed-banner-text {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  button.primed-banner.recipe-banner {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    cursor: pointer;
    border: 1px solid var(--brew-color-primary);
    border-radius: 14px;
    padding: 10px 14px;
    background: var(--brew-color-surface-container-high);
    color: var(--brew-color-primary);
  }

  button.primed-banner.recipe-banner:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .chooser-intro {
    margin: 8px 0 0;
    text-align: center;
    font-size: 15px;
    color: var(--brew-color-on-surface-variant);
  }

  .chooser-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--brew-color-on-surface-variant);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .chooser-divider::before,
  .chooser-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--brew-color-outline-variant);
  }

  .type-chip-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .type-chip {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 14px;
    border-radius: 14px;
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
    font-size: 13px;
    font-weight: 600;
  }

  .ratio-chip {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 14px;
    border-radius: 14px;
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
    font-size: 12px;
    font-weight: 600;
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

  .section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .section-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .see-all {
    font-size: 14px;
    text-decoration: none;
    color: var(--brew-color-primary);
  }

  .recent-row {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
`;
