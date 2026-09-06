import { css } from "lit";

export const CloudSyncPageStyles = css`
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

  .section-hint {
    margin: 0;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    line-height: 1.5;
  }

  .rows {
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    background: var(--brew-color-surface-container-low);
    padding: 4px 16px;
  }

  .divider {
    height: 1px;
    background: var(--brew-color-outline-variant);
  }

  .sync-now-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
  }

  .status-text {
    margin: -4px 0 0;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  .status-text.error {
    color: var(--brew-color-error);
  }
`;
