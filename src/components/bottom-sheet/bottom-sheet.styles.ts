import { css } from "lit";

export const BottomSheetStyles = css`
  /* The visible box is the native "<dialog>" in the top layer - the host
	 * itself never participates in layout or painting. */
  :host {
    display: contents;
  }

  /* "display" is deliberately left at the native default (UA stylesheet:
	 * "dialog:not([open]) { display: none; }") for the closed state - setting
	 * it here unconditionally would be an *author*-origin rule, which beats
	 * the UA-origin default regardless of selector specificity, silently
	 * keeping the (opacity: 0) dialog laid out and hit-testable even while
	 * closed. "display" is set explicitly (and unconditionally) for the
	 * open state below - including while ".closing" - so the sheet stays
	 * laid out and visible for the whole exit transition; BottomSheet.ts
	 * only calls the real dialog.close() (which reverts to the UA default)
	 * once that transition has actually finished. */
  .sheet {
    margin: 0;
    inset: auto 0 0 0;
    border: none;
    width: 100%;
    max-width: 100%;
    max-height: 85vh;
    box-sizing: border-box;
    background: var(--brew-color-surface-container-high);
    border-radius: 28px 28px 0 0;
    padding: var(--sheet-padding, 24px 20px 28px);
    gap: var(--sheet-gap, 16px);
    opacity: 0;
    transform: translateY(100%);
    transition:
      opacity 0.22s ease,
      transform 0.28s cubic-bezier(0.2, 0, 0, 1);
  }

  .sheet[open] {
    display: flex;
    flex-direction: column;
  }

  .sheet[open]:not(.closing) {
    opacity: 1;
    transform: translateY(0);
  }

  @starting-style {
    .sheet[open]:not(.closing) {
      opacity: 0;
      transform: translateY(100%);
    }
  }

  .sheet::backdrop {
    background: rgba(32, 27, 19, 0.45);
    opacity: 0;
    transition: opacity 0.22s ease;
  }

  .sheet[open]:not(.closing)::backdrop {
    opacity: 1;
  }

  @starting-style {
    .sheet[open]:not(.closing)::backdrop {
      opacity: 0;
    }
  }

  /* Expanded widths: a bottom sheet that spans the full width reads as a mobile pattern - use a centered modal dialog instead. */
  @media (min-width: 840px) {
    .sheet {
      inset: 0;
      margin: auto;
      width: 100%;
      max-width: var(--sheet-max-width, 420px);
      height: fit-content;
      border-radius: 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
      transform: translateY(24px) scale(0.96);
    }

    .sheet[open]:not(.closing) {
      transform: translateY(0) scale(1);
    }

    @starting-style {
      .sheet[open]:not(.closing) {
        transform: translateY(24px) scale(0.96);
      }
    }
  }
`;
