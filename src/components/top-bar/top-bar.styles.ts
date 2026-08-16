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
    min-width: 0;
  }

  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 22px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .trailing {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .device-status {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 16px;
    cursor: pointer;
    color: var(--brew-color-on-surface-variant);
    transition: background-color 0.15s ease;
  }

  .device-status:hover {
    background: color-mix(in srgb, currentColor 8%, transparent);
  }

  .device-status:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  /* brew-theme-toggle floats fixed at top:16px/right:16px (40px) above every screen. Since the
   * device-status control can now appear on ANY screen's top bar (not just Timer, as before),
   * its right edge would otherwise sit directly under/behind the toggle on a narrow/phone-width
   * top bar unless something reserves the space - scoped here (rather than per-view) since this
   * is now shared, global top-bar content. Not needed past EXPANDED_BREAKPOINT_PX (see
   * responsive.styles.ts), where the top bar is already centered well clear of the toggle's
   * corner. */
  @media (max-width: 839px) {
    .device-status {
      margin-right: 64px;
    }
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
