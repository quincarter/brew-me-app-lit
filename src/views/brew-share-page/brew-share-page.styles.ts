import { css } from "lit";

export const BrewSharePageStyles = css`
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
    gap: 16px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--brew-color-on-surface-variant);
  }

  .ratio-hero {
    background: var(--brew-color-primary-container);
    border-radius: 24px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .ratio-label {
    font-size: 12px;
    color: var(--brew-color-on-primary-container);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .ratio-value {
    font-size: 40px;
    font-weight: 600;
    color: var(--brew-color-on-primary-container);
  }

  .stat-row {
    display: flex;
    gap: 12px;
  }

  .stat {
    flex: 1;
    background: var(--brew-color-surface-container);
    border-radius: 16px;
    padding: 14px;
    text-align: center;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .stat-label {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }

  .share-status {
    margin: -4px 0 0;
    text-align: center;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }
`;
