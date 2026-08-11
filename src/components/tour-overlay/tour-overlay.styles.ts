import { css } from "lit";

export const TourOverlayStyles = css`
  /* The visible box is the native "<dialog>" in the top layer - no manual
	 * z-index needed, and it can no longer be covered by another top-layer
	 * element (e.g. the theme toggle). */
  :host {
    display: contents;
  }

  /* Opacity-only: a transform here would give fixed-position descendants
	 * (".cutout", ".spotlight-card") a new containing block, throwing off
	 * their viewport-relative coordinates from "getBoundingClientRect()". */
  dialog {
    position: fixed;
    inset: 0;
    margin: 0;
    padding: 0;
    border: none;
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    background: transparent;
    overflow: visible;
    opacity: 0;
    transition:
      opacity 0.22s ease,
      overlay 0.28s allow-discrete,
      display 0.28s allow-discrete;
  }

  dialog[open] {
    opacity: 1;
  }

  @starting-style {
    dialog[open] {
      opacity: 0;
    }
  }

  dialog::backdrop {
    background: transparent;
  }

  .scrim {
    position: fixed;
    inset: 0;
    pointer-events: auto;
    display: flex;
  }

  .scrim.bottom-anchored {
    align-items: flex-end;
    justify-content: center;
    padding: 24px;
    padding-bottom: 80px;
    box-sizing: border-box;
    background: rgba(15, 12, 9, 0.35);
  }

  .cutout {
    position: fixed;
    border-radius: 16px;
    box-shadow: 0 0 0 9999px rgba(15, 12, 9, 0.35);
    border: 2px solid var(--brew-color-primary);
    outline: 3px solid rgba(212, 137, 26, 0.3);
    pointer-events: none;
    transition:
      top 0.25s cubic-bezier(0.2, 0, 0, 1),
      left 0.25s cubic-bezier(0.2, 0, 0, 1),
      width 0.25s cubic-bezier(0.2, 0, 0, 1),
      height 0.25s cubic-bezier(0.2, 0, 0, 1);
  }

  .card {
    background: var(--brew-color-surface-container-high);
    border-radius: 20px;
    padding: 20px 24px;
    max-width: 360px;
    border: 1px solid var(--brew-color-outline-variant);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
    position: relative;
    pointer-events: auto;
    transition:
      opacity 0.25s ease,
      transform 0.25s cubic-bezier(0.2, 0, 0, 1);
  }

  /* Entrance-only: each card is a fresh element on every step change (Lit
	 * swaps the template rather than toggling an "[open]" attribute), so
	 * "@starting-style" can animate it in but there's no DOM-resident moment
	 * to animate it back out on step change. */
  @starting-style {
    .card {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  .bottom-card {
    width: 100%;
    max-width: 360px;
  }

  .spotlight-card {
    position: fixed;
    max-width: min(320px, calc(100vw - 32px));
  }

  .close {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .body {
    margin: 0 0 20px;
    font-size: 14px;
    line-height: 1.4;
    color: var(--brew-color-on-surface-variant);
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .progress {
    display: flex;
    gap: 6px;
    justify-content: center;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--brew-color-outline-variant);
    transition: all 0.2s ease;
  }

  .dot.active {
    background: var(--brew-color-primary);
    width: 20px;
    border-radius: 3px;
  }

  /* CSS Anchor Positioning progressive enhancement. TourOverlay.ts's
   * "anchorName" in style feature detection (anchor-positioning.utility.ts)
   * is the single source of truth for whether these rules apply - they're
   * unconditional (no "@supports (anchor-name: --foo)" wrapper) because
   * that check is known to false-positive in a couple of older engines
   * that parse the property but don't implement positioning; gating here
   * too would risk the JS and CSS disagreeing and collapsing the
   * spotlight to the scrim's top-left corner. The ".anchored" classes
   * below only ever render once the JS check has already passed. The
   * custom ident (--brew-tour-target) must match TourOverlay.ANCHOR_NAME
   * exactly.
   *
   * .anchor-proxy is an invisible element TourOverlay.ts positions to
   * mirror the real target's rect - anchor() only resolves against an
   * anchor in the *same shadow tree* as the positioned element, and the
   * real target lives in a different component's shadow root, so the
   * proxy is what .cutout.anchored/.spotlight-card.anchored actually
   * anchor to. */
  .anchor-proxy {
    position: fixed;
    anchor-name: --brew-tour-target;
    pointer-events: none;
  }

  .cutout.anchored {
    position-anchor: --brew-tour-target;
    top: calc(anchor(top) - var(--brew-tour-spotlight-padding, 8px));
    left: calc(anchor(left) - var(--brew-tour-spotlight-padding, 8px));
    width: calc(anchor-size(width) + var(--brew-tour-spotlight-padding, 8px) * 2);
    height: calc(anchor-size(height) + var(--brew-tour-spotlight-padding, 8px) * 2);
  }

  .spotlight-card.anchored {
    position-anchor: --brew-tour-target;
    top: anchor(bottom);
    left: anchor(center);
    translate: -50% 0;
    margin-top: 12px;
    position-try-fallbacks: flip-block, flip-inline;
  }
`;
