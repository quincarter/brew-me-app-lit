import { css } from "lit";

export const TypePickerStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .add-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    background: var(--brew-color-surface-container-low);
  }

  .add-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
`;
