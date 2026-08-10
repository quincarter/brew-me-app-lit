import { css } from "lit";

export const SaveSheetStyles = css`
  :host {
    display: contents;
  }

  .title {
    font-size: 20px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--brew-color-on-surface-variant);
  }

  .hint {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
`;
