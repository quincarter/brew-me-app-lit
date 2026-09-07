import { css } from "lit";

export const HomeScreenConfigRowStyles = css`
  :host {
    display: block;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 4px;
    border-radius: 10px;
    transition:
      opacity 0.15s ease,
      box-shadow 0.15s ease;
  }

  /* Drag feedback: lift the row being reordered off the list visually, same treatment brew-steps-card's own dragging row uses. */
  .row.dragging {
    opacity: 0.6;
    background: var(--brew-color-surface-container);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  }

  /*
   * icon-button's own internal .btn sets an explicit "cursor: pointer" (not
   * inherited), which would otherwise shadow a plain "cursor: grab" set
   * here on the host - go through its "--icon-button-cursor" custom
   * property instead, same pattern brew-steps-card's own drag handle uses.
   */
  .drag-handle {
    flex-shrink: 0;
    --icon-button-cursor: grab;
    touch-action: none;
    color: var(--brew-color-on-surface-variant);
  }

  .row.dragging .drag-handle {
    --icon-button-cursor: grabbing;
  }

  .row-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .headline {
    font-size: 16px;
    color: var(--brew-color-on-surface);
  }

  .supporting {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  brew-switch {
    flex-shrink: 0;
  }
`;
