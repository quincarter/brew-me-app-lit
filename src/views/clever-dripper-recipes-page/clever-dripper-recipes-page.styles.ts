import { css } from "lit";

export const CleverDripperRecipesPageStyles = css`
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
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .intro {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--brew-color-on-surface-variant);
  }

  .recipe-callout {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    background: var(--brew-color-surface-container, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--brew-color-outline-variant, rgba(255, 255, 255, 0.1));
    border-left: 4px solid var(--brew-color-primary, #e0a96d);
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
  }

  .recipe-callout brew-icon {
    color: var(--brew-color-primary, #e0a96d);
    margin-top: 2px;
    flex-shrink: 0;
  }

  .callout-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .callout-title {
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .callout-text {
    margin: 0;
    color: var(--brew-color-on-surface-variant);
  }

  .list,
  .recipes {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;
