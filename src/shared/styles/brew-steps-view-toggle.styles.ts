import { css } from "lit";

/**
 * Visual style for `renderBrewStepsViewToggle`'s Modified/Original/Diff
 * segmented control - a compact pill in the same `--brew-color-primary`
 * visual language as `.primed-banner`/`.recipe-banner`. Import into each
 * consuming view's own `static styles` array rather than redeclaring it -
 * `.primed-banner` itself is duplicated across a few view `.styles.ts`
 * files from before this convention, which is a known accepted issue, not
 * a pattern to repeat here.
 */
export const BrewStepsViewToggleStyles = css`
  .brew-steps-view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    width: fit-content;
    padding: 3px;
    border-radius: 999px;
    background: var(--brew-color-surface-container-high);
    border: 1px solid var(--brew-color-outline-variant, rgba(255, 255, 255, 0.12));
  }

  .brew-steps-view-toggle-btn {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    color: var(--brew-color-on-surface-variant);
  }

  .brew-steps-view-toggle-btn:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .brew-steps-view-toggle-btn.active {
    background: var(--brew-color-primary);
    color: var(--brew-color-on-primary);
  }
`;
