import { css } from "lit";

export const TimerPageStyles = css`
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
    align-items: center;
    /* "safe" falls back to start-alignment once content (e.g. a long guided
     * recipe's Brew Steps card) overflows the viewport - plain "center"
     * keeps the flex line centered even then, pushing part of it (usually
     * the dial, being first) above the scrollable area with no way to
     * scroll up into it. */
    justify-content: safe center;
    gap: 28px;
    padding: 20px;
  }

  .dial {
    box-sizing: border-box;
    width: 220px;
    height: 220px;
    /* Never let the column's main-axis shrink logic compress this - it's a
     * circle and must keep a 1:1 aspect ratio regardless of how much other
     * content (like a long Brew Steps card) is competing for space. */
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--brew-color-primary-container);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  /* The bordered-ring treatment is specific to a guided (recipe-primed) brew - the plain, unprimed stopwatch keeps its original filled-circle look. */
  .dial.guided {
    border: 10px solid var(--brew-color-primary-container);
    background: var(--brew-color-surface);
  }

  .dial-label {
    font-size: 12px;
    color: var(--brew-color-on-primary-container);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .dial.guided .dial-label {
    color: var(--brew-color-on-surface-variant);
  }

  .dial-value {
    font-size: 48px;
    font-weight: 600;
    color: var(--brew-color-on-primary-container);
  }

  .dial.guided .dial-value {
    font-size: 34px;
    font-weight: 700;
    color: var(--brew-color-on-surface);
  }

  .recipe-caption {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: center;
  }

  .recipe-caption-name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--brew-color-on-surface);
  }

  .recipe-caption-detail {
    margin: 0;
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .guided-options {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .mode-toggle {
    display: flex;
    gap: 8px;
  }

  .controls {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .idle-actions {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .spacer {
    width: 48px;
    display: inline-block;
  }

  .hint {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    text-align: center;
    margin: 0;
  }
`;
