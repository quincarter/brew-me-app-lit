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

  /* Bordered-ring treatment, used for every timer state (plain stopwatch or
   * a guided/recipe-primed brew alike) so the dial reads the same regardless
   * of which one is running. */
  .dial {
    box-sizing: border-box;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    border: 10px solid var(--brew-color-primary-container);
    background: var(--brew-color-surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .dial-label {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .dial-value {
    font-size: 34px;
    font-weight: 700;
    color: var(--brew-color-on-surface);
  }
`;
