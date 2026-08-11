import { css } from "lit";

export const WbcVideosPageStyles = css`
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
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px;
  }

  .event-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--brew-color-surface-container, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--brew-color-outline-variant, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
  }

  .event-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .event-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--brew-color-on-surface);
  }

  .event-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--brew-color-primary-container, rgba(224, 169, 109, 0.15));
    color: var(--brew-color-primary, #e0a96d);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .event-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--brew-color-on-surface-variant);
  }

  .event-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  .section-title {
    margin: 8px 0 0;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--brew-color-on-surface-variant);
  }

  .video-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .playlist-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .divider {
    height: 1px;
    background: var(--brew-color-outline-variant, rgba(255, 255, 255, 0.1));
  }
`;
