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

  .brew-again-card {
    margin: 12px 20px 0;
    background: var(--brew-color-primary-container);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    cursor: pointer;
  }

  .brew-again-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .brew-again-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--brew-color-on-primary-container);
    opacity: 0.75;
  }

  .brew-again-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--brew-color-on-primary-container);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brew-again-meta {
    font-size: 12px;
    color: var(--brew-color-on-primary-container);
    opacity: 0.75;
  }

  .actions {
    display: flex;
    gap: 12px;
    padding: 20px 20px 8px;
  }

  .secondary-actions {
    display: flex;
    gap: 12px;
    padding: 0 20px 8px;
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
    color: var(--brew-color-primary);
  }

  .recent-empty {
    margin: 0 20px 28px;
  }

  .recent-row {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    padding: 0 20px 28px;
  }
`;
