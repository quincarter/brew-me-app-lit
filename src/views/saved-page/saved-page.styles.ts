import { css } from "lit";

export const SavedPageStyles = css`
  :host {
    display: block;
    height: 100%;
  }

  .screen {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content {
    padding: 8px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px;
    text-align: center;
    color: var(--brew-color-outline);
  }

  .empty-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .empty-body {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }
`;
