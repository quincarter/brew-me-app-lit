import { css } from "lit";

export const BrewStepsCardStyles = css`
  :host {
    display: block;
  }

  .card {
    background: var(--brew-color-surface-container-low);
    border-radius: 20px;
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 14px 16px;
    box-sizing: border-box;
    color: var(--brew-color-on-surface-variant);
  }

  .title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .caret-btn {
    all: unset;
    display: inline-flex;
    cursor: pointer;
    color: var(--brew-color-on-surface-variant);
  }

  .caret-btn:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
    border-radius: 50%;
  }

  .body {
    padding: 0 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .timeline {
    display: flex;
    height: 10px;
    border-radius: 6px;
    overflow: hidden;
    background: var(--brew-color-surface-container-highest);
  }

  .timeline-segment {
    flex-shrink: 0;
    height: 100%;
  }

  .timeline-segment + .timeline-segment {
    border-left: 1px solid var(--brew-color-surface-container-low);
  }

  /*
   * Ordered so adjacent segments stay visually distinct: primary and
   * secondary share a warm brown hue and read as near-identical next to
   * each other (especially in light mode), so tertiary's green sits
   * between them instead of secondary going straight after primary.
   */
  .segment-0 {
    background: var(--brew-color-primary);
  }

  .segment-1 {
    background: var(--brew-color-tertiary);
  }

  .segment-2 {
    background: var(--brew-color-secondary);
  }

  .segment-3 {
    background: var(--brew-color-outline);
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .step-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .step-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .step-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .step-note {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
  }

  /* Read-only treatment for long/multi-word note values (e.g. full WAC
   * recipe prose) that would overflow or clip the fixed-height .pill below -
   * wraps as plain text under the label instead. */
  .step-note-value {
    margin-top: 2px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--brew-color-on-surface-variant);
    white-space: normal;
    word-break: break-word;
  }

  .pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 12px;
    border-radius: 13px;
    font-size: 12px;
    font-weight: 600;
    background: var(--brew-color-surface-container-highest);
    color: var(--brew-color-on-surface-variant);
  }

  .pill-timed {
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
  }

  .edit-row {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 10px;
    transition:
      opacity 0.15s ease,
      box-shadow 0.15s ease;
  }

  /* Drag feedback: lift the row being reordered off the list visually
   * without introducing any new color tokens - reuses the existing surface
   * scale so it holds up in both light and dark. */
  .edit-row.dragging {
    opacity: 0.6;
    background: var(--brew-color-surface-container);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
  }

  /*
   * icon-button's own internal .btn sets an explicit "cursor: pointer" (not
   * inherited), which would otherwise shadow a plain "cursor: grab" set
   * here on the host - go through its "--icon-button-cursor" custom
   * property instead, same pattern it already uses for bg/color.
   */
  .drag-handle {
    flex-shrink: 0;
    --icon-button-cursor: grab;
    touch-action: none;
    color: var(--brew-color-on-surface-variant);
  }

  .edit-row.dragging .drag-handle {
    --icon-button-cursor: grabbing;
  }

  .label-select,
  .value-input {
    height: 40px;
    border: 1px solid var(--brew-color-outline);
    border-radius: 10px;
    background: var(--brew-color-surface-container-lowest);
    color: var(--brew-color-on-surface);
    font-family: inherit;
    font-size: 13px;
    padding: 0 10px;
    box-sizing: border-box;
  }

  .label-select {
    flex: 1.4;
    min-width: 0;
  }

  .value-input {
    flex: 1;
    min-width: 0;
  }

  .label-select:focus-visible,
  .value-input:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: -1px;
  }

  .kind-toggle {
    flex-shrink: 0;
    height: 40px;
    padding: 0 10px;
    border-radius: 10px;
    border: 1px solid var(--brew-color-outline-variant);
    background: transparent;
    color: var(--brew-color-on-surface-variant);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .kind-toggle:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }

  .custom-label-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border-radius: 12px;
    background: var(--brew-color-surface-container);
  }

  .custom-label-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .edit-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
`;
