import { css } from "lit";

export const AeropressRecipesPageStyles = css`
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
    padding: 8px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .intro {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--brew-color-on-surface-variant);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .recipes {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .source {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--brew-color-surface-container);
    border-radius: 16px;
    padding: 14px 16px;
    text-decoration: none;
    color: var(--brew-color-on-surface-variant);
  }

  .source-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .source-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .source-sub {
    font-size: 12px;
  }
`;
