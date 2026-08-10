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

  .scrim.centered {
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    background: rgba(32, 27, 19, 0.55);
  }

  /*
   * No background here on purpose - the real element underneath shows
   * through the cutout. The div still needs to exist to capture clicks so
   * the tour stays "look-only" while it's active.
   */
  .cutout {
    position: fixed;
    border-radius: 16px;
    box-shadow: 0 0 0 9999px rgba(32, 27, 19, 0.55);
    pointer-events: auto;
    transition:
      top 0.2s ease,
      left 0.2s ease,
      width 0.2s ease,
      height 0.2s ease;
  }

  .card {
    background: var(--brew-color-surface-container-high);
    border-radius: 20px;
    padding: 24px;
    max-width: 360px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
    position: relative;
    pointer-events: auto;
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
