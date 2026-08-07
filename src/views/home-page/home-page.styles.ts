import { css } from "lit";

export const HomePageStyles = css`
  :host {
    display: block;
    height: 100%;
  }

  .screen {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .greeting {
    padding: 28px 20px 4px;
  }

  .eyebrow {
    font-size: 14px;
    color: var(--brew-color-on-surface-variant);
  }

  .headline {
    font-size: 32px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
    margin-top: 2px;
  }

  .actions {
    display: flex;
    gap: 12px;
    padding: 20px 20px 8px;
  }

  .stats {
    display: flex;
    gap: 12px;
    padding: 8px 20px 16px;
  }

  .section-header {
    padding: 12px 20px 8px;
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
  }

  .recent-empty {
    margin: 0 20px 28px;
  }

  .recent-row {
    display: flex;
    gap: 10px;
    padding: 0 20px 28px;
    overflow-x: auto;
  }

  .recent-card {
    min-width: 140px;
    flex-shrink: 0;
    background: var(--brew-color-surface-container-low);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-decoration: none;
    cursor: pointer;
  }

  .recent-type {
    font-size: 14px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .recent-ratio {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }
`;
