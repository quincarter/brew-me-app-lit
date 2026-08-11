import { css } from "lit";

export const InstallPromptStyles = css`
  :host {
    display: contents;
  }

  .header {
    display: flex;
    justify-content: flex-end;
    /* Pulls the close button back up into the sheet's top padding, so the
		 * previews below sit where they visually did before this used
		 * "<brew-bottom-sheet>"'s own padding instead of a bespoke ".sheet". */
    margin: -8px -8px -8px 0;
  }

  .previews {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding-top: 8px;
  }

  .preview {
    width: 96px;
    height: auto;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
    border: 1px solid var(--brew-color-outline-variant);
  }

  .preview:first-child {
    transform: rotate(-4deg) translateY(4px);
  }

  .preview:last-child {
    transform: rotate(4deg) translateY(4px);
  }

  .identity {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    flex-shrink: 0;
  }

  .identity-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .app-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .app-url {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  .pitch {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: var(--brew-color-on-surface-variant);
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  /* Expanded widths: "<brew-bottom-sheet>" itself already switches to a
	 * centered modal card past this breakpoint (default "--sheet-max-width"
	 * of 420px matches what this sheet used before) - only the preview
	 * images still need their own size bump. */
  @media (min-width: 840px) {
    .preview {
      width: 120px;
    }
  }
`;
