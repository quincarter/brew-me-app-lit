import { css } from "lit";

export const RecipePickerSheetStyles = css`
  :host {
    display: contents;
  }

  .title {
    font-size: 20px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .hint {
    margin: -8px 0 0;
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 60vh;
    overflow: auto;
  }

  .section-label {
    margin: 4px 0 -2px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--brew-color-on-surface-variant);
  }

  .section-label:not(:first-child) {
    padding-top: 8px;
    border-top: 1px solid var(--brew-color-outline-variant);
  }
`;
