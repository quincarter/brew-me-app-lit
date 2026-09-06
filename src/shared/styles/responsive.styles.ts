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

  /*
   * brew-bottom-nav is position: fixed (an overlay, not a flex sibling), so
   * it never actually shrinks .content/.scroll's own flex-computed box -
   * that box already extends underneath it. A padding-bottom reservation
   * alone only pays off once the content is tall enough to actually need
   * scrolling: scrolling to the true bottom then reveals the last item
   * pushed up clear of the nav. When the content is shorter than the
   * viewport, nothing overflows, no scrolling happens at all, and the tail
   * end of the content just renders wherever it naturally falls - which can
   * land in the region the fixed nav covers, with no way to scroll it into
   * view. Using margin-bottom instead genuinely shrinks .content/.scroll's
   * own box by the nav's height, so content is never laid out behind it in
   * the first place, whether or not scrolling ever engages.
   */
  .content,
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
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
      /* No fixed bottom bar at this breakpoint (brew-bottom-nav becomes a
       * left rail instead) - just cosmetic bottom breathing room. */
      margin-bottom: 20px;
    }
  }
`;
