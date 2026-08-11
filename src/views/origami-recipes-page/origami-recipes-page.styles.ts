import { css } from "lit";

export const OrigamiRecipesPageStyles = css`
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
    gap: 12px;
  }
`;
