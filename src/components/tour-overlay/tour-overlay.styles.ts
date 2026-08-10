import { css } from "lit";

export const TourOverlayStyles = css`
  :host {
    position: fixed;
    inset: 0;
    z-index: 50;
    pointer-events: none;
  }

  .scrim {
    position: fixed;
    inset: 0;
    pointer-events: auto;
    display: flex;
  }

  .scrim.bottom-anchored {
    align-items: flex-end;
    justify-content: center;
    padding: 24px;
    padding-bottom: 80px;
    box-sizing: border-box;
    background: rgba(15, 12, 9, 0.35);
  }

  .cutout {
    position: fixed;
    border-radius: 16px;
    box-shadow: 0 0 0 9999px rgba(15, 12, 9, 0.35);
    border: 2px solid var(--brew-color-primary);
    outline: 3px solid rgba(212, 137, 26, 0.3);
    pointer-events: none;
    transition:
      top 0.25s cubic-bezier(0.2, 0, 0, 1),
      left 0.25s cubic-bezier(0.2, 0, 0, 1),
      width 0.25s cubic-bezier(0.2, 0, 0, 1),
      height 0.25s cubic-bezier(0.2, 0, 0, 1);
  }

  .card {
    background: var(--brew-color-surface-container-high);
    border-radius: 20px;
    padding: 20px 24px;
    max-width: 360px;
    border: 1px solid var(--brew-color-outline-variant);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
    position: relative;
    pointer-events: auto;
  }

  .bottom-card {
    width: 100%;
    max-width: 360px;
  }

  .spotlight-card {
    position: fixed;
    max-width: 320px;
  }

  .close {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .body {
    margin: 0 0 20px;
    font-size: 14px;
    line-height: 1.4;
    color: var(--brew-color-on-surface-variant);
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .progress {
    display: flex;
    gap: 6px;
    justify-content: center;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--brew-color-outline-variant);
    transition: all 0.2s ease;
  }

  .dot.active {
    background: var(--brew-color-primary);
    width: 20px;
    border-radius: 3px;
  }
`;
