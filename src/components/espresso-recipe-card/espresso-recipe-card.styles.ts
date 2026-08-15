import { css } from "lit";

export const EspressoRecipeCardStyles = css`
  :host {
    display: block;
  }

  .card {
    background: var(--brew-color-surface-container-low);
    border-radius: 20px;
    overflow: hidden;
  }

  .header {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 14px 16px;
    cursor: pointer;
    color: var(--brew-color-on-surface-variant);
  }

  .header:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: -2px;
  }

  .who {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    font-size: 15px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  /* Ratio/dose pills mirror the Calculator's own .ratio-chip/.type-chip
   * badges (primary-container for the ratio, secondary-container for the
   * doses) rather than inventing a new visual style for this card. */
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 10px;
    border-radius: 11px;
    font-size: 11px;
    font-weight: 600;
  }

  .ratio-badge {
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
  }

  .dose-badge {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
  }

  .body {
    padding: 0 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .method-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--brew-color-on-surface-variant);
  }

  .steps {
    margin: 0;
    padding-left: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--brew-color-on-surface);
  }

  .steps li {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
  }

  .step-line-label {
    font-weight: 500;
  }

  .step-line-value {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  /* Diff-view treatment (only rendered when a consumer sets diffAgainst -
   * the "Original recipe" sheet's Diff mode) - annotated in place on the
   * one and only step list, since this card has no separate raw-prose
   * Method section to diff against instead. Same visual language as
   * RecipeCard/PourOverRecipeCard's own diff rows. */
  .steps li.step-changed,
  .steps li.step-added,
  .steps li.step-removed,
  .steps li.step-moved {
    border-left: 3px solid transparent;
    padding-left: 8px;
    border-radius: 4px;
  }

  .steps li.step-changed {
    border-left-color: var(--brew-color-primary);
  }

  .steps li.step-added {
    border-left-color: var(--brew-color-tertiary);
  }

  .steps li.step-removed {
    border-left-color: var(--brew-color-error);
    opacity: 0.75;
  }

  .steps li.step-changed .diff-badge {
    color: var(--brew-color-primary);
  }

  .steps li.step-added .diff-badge {
    color: var(--brew-color-tertiary);
  }

  .steps li.step-removed .diff-badge {
    color: var(--brew-color-error);
  }

  .steps li.step-removed .step-line-label,
  .steps li.step-removed .step-line-value {
    text-decoration: line-through;
  }

  /* "Moved" is an independent signal from changed/added/removed (a row can
   * be both changed and moved at once), so it's its own class rather than
   * another diffState-derived variant. An inset right-edge accent (rather
   * than another left border) so it never fights the left border already
   * used for changed/added/removed when both classes land on the same
   * row. Uses secondary rather than primary/tertiary/error so all four
   * diff signals stay visually distinct - same token as
   * RecipeCard/brew-steps-card's own "moved" treatment. */
  .steps li.step-moved {
    box-shadow: inset -3px 0 0 var(--brew-color-secondary);
  }

  .diff-old {
    color: var(--brew-color-on-surface-variant);
    text-decoration: line-through;
  }

  .diff-arrow {
    color: var(--brew-color-on-surface-variant);
  }

  .diff-new {
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .diff-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brew-color-on-surface-variant);
  }

  .diff-badge-moved {
    color: var(--brew-color-secondary);
  }

  .tagline {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--brew-color-on-surface-variant);
  }

  .note {
    margin: 0;
    font-size: 13px;
    font-style: italic;
    line-height: 1.5;
    color: var(--brew-color-on-surface-variant);
    border-left: 3px solid var(--brew-color-outline-variant);
    padding-left: 12px;
  }
`;
