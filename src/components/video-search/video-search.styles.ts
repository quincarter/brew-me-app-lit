import { css } from "lit";

export const VideoSearchStyles = css`
  :host {
    display: block;
  }

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
`;
