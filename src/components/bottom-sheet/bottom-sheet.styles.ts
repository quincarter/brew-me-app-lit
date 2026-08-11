import { css } from "lit";

export const BottomSheetStyles = css`
  /* The visible box is the native "<dialog>" in the top layer - the host
	 * itself never participates in layout or painting. */
  :host {
    display: contents;
  }

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
    display: flex;
    flex-direction: column;
    gap: var(--sheet-gap, 16px);
    opacity: 0;
    transform: translateY(100%);
    transition:
      opacity 0.22s ease,
      transform 0.28s cubic-bezier(0.2, 0, 0, 1),
      overlay 0.28s allow-discrete,
      display 0.28s allow-discrete;
  }

  .sheet[open] {
    opacity: 1;
    transform: translateY(0);
  }

  @starting-style {
    .sheet[open] {
      opacity: 0;
      transform: translateY(100%);
    }
  }

  .sheet::backdrop {
    background: rgba(32, 27, 19, 0.45);
    opacity: 1;
    transition:
      opacity 0.22s ease,
      overlay 0.28s allow-discrete,
      display 0.28s allow-discrete;
  }

  @starting-style {
    .sheet[open]::backdrop {
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

    .sheet[open] {
      transform: translateY(0) scale(1);
    }

    @starting-style {
      .sheet[open] {
        transform: translateY(24px) scale(0.96);
      }
    }
  }
`;
