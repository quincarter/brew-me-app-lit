import { css } from "lit";

export const DataSettingsPageStyles = css`
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

  .section-title.danger {
    color: var(--brew-color-error);
  }

  .section-hint {
    margin: -6px 0 0;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    line-height: 1.5;
  }

  .add-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .data-actions {
    display: flex;
    gap: 8px;
  }

  .divider {
    height: 1px;
    background: var(--brew-color-outline-variant);
    margin: 4px 0;
  }

  .status-text {
    margin: -6px 0 0;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  .danger-zone {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid var(--brew-color-error);
  }
`;
