import { css } from "lit";

export const GeneralSettingsPageStyles = css`
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
    padding: 8px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-hint {
    margin: -6px 0 0;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    line-height: 1.5;
  }

  .divider {
    height: 1px;
    background: var(--brew-color-outline-variant);
    margin: 4px 0;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
  }

  .row-label {
    font-size: 16px;
    color: var(--brew-color-on-surface);
  }

  .feature-row-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;
