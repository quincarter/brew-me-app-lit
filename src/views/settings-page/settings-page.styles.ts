import { css } from "lit";

export const SettingsPageStyles = css`
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

  .type-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .type-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    padding: 0 14px;
    border-radius: 16px;
    background: var(--brew-color-surface-container);
    color: var(--brew-color-on-surface-variant);
    font-size: 13px;
    font-weight: 500;
  }

  .type-tag.custom {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
    padding-right: 8px;
  }

  .tag-remove {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    cursor: pointer;
    color: inherit;
  }

  .tag-remove:hover {
    background: color-mix(in srgb, currentColor 16%, transparent);
  }

  .add-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    background: var(--brew-color-surface-container-low);
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

  .feature-rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .feature-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border-radius: 16px;
    background: var(--brew-color-surface-container-low);
  }

  .feature-row-sublabel {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  .feature-row-telemetry {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px 0;
  }

  .feature-row-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
