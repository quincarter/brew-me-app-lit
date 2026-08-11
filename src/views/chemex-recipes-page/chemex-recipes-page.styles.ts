import { css } from "lit";

export const ChemexRecipesPageStyles = css`
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

  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;
