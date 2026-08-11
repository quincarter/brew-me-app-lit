import { css } from "lit";

export const TimerDialStyles = css`
  :host {
    display: block;
    /* Never let the column's main-axis shrink logic compress this - it's a
     * circle and must keep a 1:1 aspect ratio regardless of how much other
     * content (like a long Brew Steps card) is competing for space in the
     * page's ".content" flex column. */
    flex-shrink: 0;
  }

  .dial {
    box-sizing: border-box;
    width: 220px;
    height: 220px;
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
`;
