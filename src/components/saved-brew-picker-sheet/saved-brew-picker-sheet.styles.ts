import { css } from "lit";

export const SavedBrewPickerSheetStyles = css`
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
`;
