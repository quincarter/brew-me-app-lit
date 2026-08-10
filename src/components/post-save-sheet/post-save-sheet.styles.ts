import { css } from "lit";

export const PostSaveSheetStyles = css`
  :host {
    display: contents;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .identity {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .identity-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .actions > * {
    flex: 1;
  }
`;
