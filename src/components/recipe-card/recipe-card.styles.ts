import { css } from "lit";

export const RecipeCardStyles = css`
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

  .place {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 28px;
    padding: 0 10px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    box-sizing: border-box;
    background: var(--brew-color-surface-container-highest);
    color: var(--brew-color-on-surface-variant);
  }

  .place-1 {
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
  }

  .place-2 {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
  }

  .place-3 {
    background: var(--brew-color-tertiary-container);
    color: var(--brew-color-on-tertiary-container);
  }

  .who {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .competitor {
    font-size: 15px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .country {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .body {
    padding: 0 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .setup {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--brew-color-surface-container);
    border-radius: 14px;
    padding: 12px 14px;
  }

  .setup-row {
    display: flex;
    gap: 10px;
    font-size: 13px;
    line-height: 1.45;
  }

  .setup dt {
    flex-shrink: 0;
    min-width: 74px;
    font-weight: 600;
    color: var(--brew-color-on-surface-variant);
  }

  .setup dd {
    margin: 0;
    color: var(--brew-color-on-surface);
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
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--brew-color-on-surface);
  }

  /* Diff-view treatment (only rendered when a consumer sets diffAgainst -
   * the "Original recipe" sheet's Diff mode) - a thin accent left border
   * plus a small text badge, kept light to match this card's own existing
   * Setup/Method rhythm rather than borrowing brew-steps-card's heavier
   * pill-row look wholesale. */
  .setup-row-changed,
  .setup-row-removed {
    border-left: 3px solid transparent;
    padding-left: 8px;
    margin-left: -11px;
    border-radius: 4px;
  }

  .setup-row-changed {
    border-left-color: var(--brew-color-primary);
  }

  .setup-row-removed {
    border-left-color: var(--brew-color-error);
    opacity: 0.75;
  }

  .setup-row dd {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
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

  .setup-row-changed .diff-badge {
    color: var(--brew-color-primary);
  }

  .setup-row-removed .diff-badge {
    color: var(--brew-color-error);
  }

  .steps li.step-changed,
  .steps li.step-added,
  .steps li.step-removed {
    border-left: 3px solid transparent;
    padding-left: 8px;
    border-radius: 4px;
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
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

  .step-line-label {
    font-weight: 500;
  }

  .step-line-value {
    font-size: 13px;
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
