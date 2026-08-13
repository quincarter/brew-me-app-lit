import { css } from "lit";

/**
 * Shared responsive breakpoint + rail-width constants, kept here as the
 * single source of truth. `brew-bottom-nav` reads the same numbers (see
 * bottom-nav.styles.ts) to switch from a bottom tab bar (compact / phone
 * widths) to a fixed left navigation rail (expanded / tablet+desktop
 * widths) - the Material 3 "compact vs. expanded" window size pattern.
 */
export const EXPANDED_BREAKPOINT_PX = 840;
export const RAIL_WIDTH_PX = 88;
export const CONTENT_MAX_WIDTH_PX = 640;

/**
 * Drop this into any view's `static styles` array alongside its own
 * styles. At expanded widths it (a) shifts `.screen` right to clear the
 * fixed nav rail and (b) keeps the view's main scrollable area
 * (`.content` or `.scroll`, whichever the view uses) from stretching
 * edge-to-edge on wide screens.
 */
export const responsiveScreenStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .screen {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding-top: env(safe-area-inset-top, 0px);
  }

  .content,
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    touch-action: pan-y;
  }

  @media (min-width: 840px) {
    .screen {
      padding-left: 88px;
      box-sizing: border-box;
    }

    .content,
    .scroll {
      max-width: 640px;
      width: 100%;
      margin-inline: auto;
      box-sizing: border-box;
      padding-bottom: 20px;
    }
  }
`;
