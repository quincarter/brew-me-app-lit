import { css } from "lit";

export const TimerRecipePanelStyles = css`
  /* This component only groups related Timer-page markup - it renders no
   * wrapping box of its own, so its top-level nodes (.recipe-caption,
   * .guided-options, the optional brew-steps-card) become direct flex
   * items of the page's ".content" column, preserving that layout's
   * gap/alignment exactly as if they were still inlined in the page. */
  :host {
    display: contents;
  }

  .recipe-caption {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: center;
  }

  .recipe-caption-name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--brew-color-on-surface);
  }

  .recipe-caption-detail {
    margin: 0;
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .guided-options {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .mode-toggle {
    display: flex;
    gap: 8px;
  }
`;
