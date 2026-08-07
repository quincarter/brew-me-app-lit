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

  .videos {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--brew-color-on-surface-variant);
  }

  /* The "search YouTube for more" prompt that sits below the curated videos. */
  .video-search {
    background: var(--brew-color-tertiary-container);
    border-radius: 20px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .video-icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--brew-color-surface-container-lowest);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--brew-color-tertiary);
  }

  .video-text {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .video-search-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--brew-color-on-tertiary-container);
  }

  .video-subtitle {
    font-size: 12px;
    color: var(--brew-color-on-tertiary-container);
  }

  .recipes-link {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    cursor: pointer;
  }

  .recipes-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--brew-color-surface-container-lowest);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--brew-color-secondary);
  }

  .recipes-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .recipes-title {
    font-size: 15px;
    font-weight: 500;
  }

  .recipes-subtitle {
    font-size: 12px;
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

  .saved-match {
    background: var(--brew-color-primary-container);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    color: var(--brew-color-on-primary-container);
    cursor: pointer;
  }

  .saved-match-text {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .saved-match-eyebrow {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .saved-match-value {
    font-size: 18px;
    font-weight: 600;
    margin-top: 2px;
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
