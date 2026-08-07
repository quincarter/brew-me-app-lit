import { css } from "lit";

export const EmptyStateStyles = css`
  :host {
    display: block;
  }

  .empty-state {
    margin: 0 auto;
    padding: 28px 20px 24px;
    max-width: 320px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    box-sizing: border-box;
  }

  .empty-state-image {
    width: 96px;
    height: auto;
    filter: grayscale(0.15);
  }

  .empty-state-message {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: var(--brew-color-on-surface-variant);
    max-width: 240px;
  }
`;
