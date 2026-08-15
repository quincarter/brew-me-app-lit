import { css } from "lit";

export const EspressoRecipesPageStyles = css`
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

  .recipes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-header {
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 8px;
  }

  .section-header:first-child {
    margin-top: 0;
  }

  .recipe-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;
