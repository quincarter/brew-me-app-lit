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

  /* The dial plus its baked-in reset/clear/play-pause-or-seal controls -
   * see brew-timer-dial's own :host for why it can't shrink below 220px.
   * The side buttons float in the open space either side of the dial and
   * the fab overlaps its bottom rim (see .dial-fab below), so this reads
   * as one control cluster rather than a dial with a separate row beneath
   * it. */
  .dial-cluster {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
  }

  .dial-side-btn {
    flex-shrink: 0;
  }

  /* Keeps the dial itself centered when only the reset button (left) is
   * showing and there's no "clear brew" button (right) yet to balance it -
   * an invisible stand-in the same size as a standard icon button. */
  .dial-side-spacer {
    flex-shrink: 0;
    width: var(--icon-button-size, 40px);
    height: var(--icon-button-size, 40px);
  }

  .dial-fab {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 35%);
    z-index: 1;
  }

  .dial-hint {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    text-align: center;
    margin: 0;
    /* The fab hangs ~25px below the dial's own bottom edge (see .dial-fab) -
     * a little extra clearance on top of .content's usual 28px gap so the
     * hint text doesn't read as crowded underneath it. */
    margin-top: 14px;
  }
`;
