import { css } from "lit";

export const TopBarStyles = css`
  :host {
    display: block;
    flex-shrink: 0;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
  }

  .title {
    flex: 1;
    font-size: 22px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  /* Keep in sync with CONTENT_MAX_WIDTH_PX in shared/styles/responsive.styles.ts so the title lines up with the content column beneath it. */
  @media (min-width: 840px) {
    .bar {
      max-width: 640px;
      width: 100%;
      margin-inline: auto;
      box-sizing: border-box;
      padding: 20px 8px;
    }
  }
`;
