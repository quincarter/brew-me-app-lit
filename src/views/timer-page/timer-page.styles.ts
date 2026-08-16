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
    overflow-y: auto;
    overflow-x: hidden;
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

  /* .content centers its children by default (align-items: center above),
   * but the sticky active-step banner needs to span the full row - and to
   * stay pinned via "top: 0" against .content's own scrollport rather than
   * sliding along with everything else - so it's stretched full width here
   * rather than in the component's own :host (which only knows its own
   * box, not this flex row's alignment). */
  brew-active-step-banner {
    align-self: stretch;
    width: 100%;
  }

  .devices-banner {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
    padding: 10px 14px;
    border-radius: 16px;
    background: var(--brew-color-surface-container-low);
  }

  .devices-banner-header {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
  }

  .devices-banner-title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .devices-banner-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 0;
  }

  .devices-banner-row-label {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  .devices-banner-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: -4px;
  }

  .telemetry-row {
    display: flex;
    gap: 12px;
    width: 100%;
  }
`;
