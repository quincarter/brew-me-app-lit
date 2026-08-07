import { css } from "lit";

export const InstallPromptStyles = css`
  /*
	 * No ":host(:empty)" rule - see the note in save-sheet.styles.ts. Empty
	 * host visibility is handled by render() returning nothing plus
	 * "pointer-events: none" below.
	 */
  :host {
    position: fixed;
    inset: 0;
    z-index: 30;
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
    position: relative;
    width: 100%;
    box-sizing: border-box;
    background: var(--brew-color-surface-container-high);
    border-radius: 28px 28px 0 0;
    padding: 20px 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .close {
    position: absolute;
    top: 8px;
    right: 8px;
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

  /* Expanded widths: center as a modal card instead of a full-width sheet. */
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

    .preview {
      width: 120px;
    }
  }
`;
