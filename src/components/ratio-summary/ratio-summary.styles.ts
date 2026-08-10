import { css } from "lit";

export const RatioSummaryStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .ratio-hero {
    padding: 8px 0 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .ratio-label {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .ratio-value {
    font-size: 44px;
    font-weight: 700;
    color: var(--brew-color-primary);
    line-height: 1;
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
`;
