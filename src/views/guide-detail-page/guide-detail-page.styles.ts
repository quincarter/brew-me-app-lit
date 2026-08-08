import { css } from "lit";

export const GuideDetailPageStyles = css`
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
    gap: 18px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .product-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .videos {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .glossary {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--brew-color-on-surface-variant);
  }

  .description {
    font-size: 14px;
    color: var(--brew-color-on-surface);
    line-height: 1.6;
    margin: 0;
  }

  .stat-row {
    display: flex;
    gap: 12px;
  }

  .stat {
    flex: 1;
    background: var(--brew-color-surface-container);
    border-radius: 16px;
    padding: 12px;
    text-align: center;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .stat-label {
    font-size: 11px;
    color: var(--brew-color-on-surface-variant);
  }

  .ai-tip {
    background: var(--brew-color-surface-container-low);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ai-tip-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--brew-color-primary);
  }

  .ai-tip-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ai-tip-body {
    font-size: 14px;
    color: var(--brew-color-on-surface);
    line-height: 1.5;
    margin: 0;
  }

  .saved-matches {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .saved-match-row {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .no-match {
    background: var(--brew-color-surface-container);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .no-match p {
    font-size: 14px;
    color: var(--brew-color-on-surface);
    margin: 0;
  }
`;
