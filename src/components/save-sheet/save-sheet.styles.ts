import { css } from "lit";

export const SaveSheetStyles = css`
  /*
	 * Note: no ":host(:empty)" rule here - the *light DOM* children of this
	 * element are always empty regardless of what's rendered into its shadow
	 * root, so that selector would always match and permanently hide this
	 * component. Visibility when closed is handled entirely by render()
	 * returning an empty template (nothing in the shadow root) plus
	 * "pointer-events: none" below, so the empty host never blocks clicks.
	 */
  :host {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: block;
    pointer-events: none;
  }

  .scrim {
    position: absolute;
    inset: 0;
    background: rgba(32, 27, 19, 0.45);
    display: flex;
    align-items: flex-end;
    pointer-events: auto;
  }

  .sheet {
    width: 100%;
    box-sizing: border-box;
    background: var(--brew-color-surface-container-high);
    border-radius: 28px 28px 0 0;
    padding: 24px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .title {
    font-size: 20px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hint {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  /* Expanded widths: a bottom sheet that spans the full width reads as a mobile pattern - use a centered modal dialog instead. */
  @media (min-width: 840px) {
    .scrim {
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
    }

    .sheet {
      width: 100%;
      max-width: 420px;
      border-radius: 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
    }
  }
`;
