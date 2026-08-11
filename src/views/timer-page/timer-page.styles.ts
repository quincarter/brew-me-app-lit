import { css } from "lit";

export const TimerPageStyles = css`
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
    align-items: center;
    /* "safe" falls back to start-alignment once content (e.g. a long guided
     * recipe's Brew Steps card) overflows the viewport - plain "center"
     * keeps the flex line centered even then, pushing part of it (usually
     * the dial, being first) above the scrollable area with no way to
     * scroll up into it. */
    justify-content: safe center;
    gap: 28px;
    padding: 20px;
  }
`;
