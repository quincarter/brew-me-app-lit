import { css } from "lit";

export const VideoCardStyles = css`
  :host {
    display: block;
  }

  .card {
    background: var(--brew-color-surface-container-low);
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--brew-color-surface-container-highest);
  }

  .poster {
    all: unset;
    box-sizing: border-box;
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .poster:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: -2px;
  }

  .play-badge {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
  }

  .poster:hover .play-badge {
    background: var(--brew-color-primary);
    color: var(--brew-color-on-primary);
  }

  .player {
    width: 100%;
    height: 100%;
    display: block;
    border: 0;
  }

  .meta {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .video-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
    line-height: 1.4;
  }

  .channel {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .external {
    margin-top: 6px;
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    width: fit-content;
  }

  .external:hover {
    text-decoration: underline;
  }
`;
