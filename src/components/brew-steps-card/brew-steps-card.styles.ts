import { css } from "lit";

export const BrewStepsCardStyles = css`
  :host {
    display: block;
    width: 100%;
    max-width: 480px;
    box-sizing: border-box;
    margin-inline: auto;
  }

  .card {
    position: relative;
    background: var(--brew-color-surface-container-low);
    border-radius: 20px;
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

  .condensed-body {
    padding: 0 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .condensed-cue {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 2px;
  }

  .cue-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .cue-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .cue-note {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: break-spaces;
  }

  .timeline {
    position: relative;
    display: flex;
    height: 10px;
    border-radius: 6px;
    overflow: hidden;
    background: var(--brew-color-surface-container-highest);
  }

  /* Live elapsed-time marker over the proportional segments - only rendered when a consumer (the Timer screen) sets elapsedSeconds. */
  .timeline-progress {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 2px;
    background: var(--brew-color-on-surface);
    box-shadow: 0 0 0 2px var(--brew-color-surface);
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

  /* "done"/"active"/"upcoming" only render when a consumer sets elapsedSeconds (the Timer screen) - the plain static card (Calculator/Saved Detail) never sets these classes. */
  .step-row.step-done .step-label {
    color: var(--brew-color-on-surface-variant);
  }

  .step-row.step-active .step-label {
    color: var(--brew-color-primary);
    font-weight: 700;
  }

  .step-row.step-active .pill-timed {
    background: var(--brew-color-primary);
    color: var(--brew-color-on-primary);
  }

  .step-check {
    flex-shrink: 0;
    color: var(--brew-color-primary);
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

  .label-picker-container {
    position: relative;
    flex: 1.4;
    min-width: 0;
  }

  .label-select-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    width: 100%;
    height: 44px;
    padding: 0 10px;
    border: 1px solid var(--brew-color-outline);
    border-radius: 10px;
    background: var(--brew-color-surface-container-lowest);
    color: var(--brew-color-on-surface);
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    box-sizing: border-box;
    text-align: left;
  }

  .label-select-btn:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: -1px;
  }

  .label-select-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .label-select-text.placeholder {
    color: var(--brew-color-on-surface-variant);
  }

  .label-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .label-menu-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: max(100%, 210px);
    max-height: 260px;
    overflow-y: auto;
    z-index: 100;
    background: var(--brew-color-surface-container-high, #2b2927);
    border: 1px solid var(--brew-color-outline-variant, rgba(255, 255, 255, 0.15));
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-sizing: border-box;
  }

  .label-menu-dropdown.upward {
    top: auto;
    bottom: calc(100% + 4px);
  }

  .label-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-height: 40px;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--brew-color-on-surface);
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }

  .label-menu-item:hover,
  .label-menu-item:focus-visible {
    background: var(--brew-color-surface-container-highest, rgba(255, 255, 255, 0.08));
    outline: none;
  }

  .label-menu-item.selected {
    background: var(--brew-color-primary-container, rgba(224, 169, 109, 0.18));
    color: var(--brew-color-primary, #e0a96d);
    font-weight: 600;
  }

  .label-menu-item.add-custom-item {
    color: var(--brew-color-primary, #e0a96d);
    border-top: 1px solid var(--brew-color-outline-variant, rgba(255, 255, 255, 0.1));
    margin-top: 4px;
    padding-top: 10px;
    border-radius: 0 0 8px 8px;
  }

  .label-select,
  .value-input {
    height: 44px;
    border: 1px solid var(--brew-color-outline);
    border-radius: 10px;
    background: var(--brew-color-surface-container-lowest);
    color: var(--brew-color-on-surface);
    font-family: inherit;
    font-size: 16px;
    padding: 0 10px;
    box-sizing: border-box;
  }

  .label-select {
    flex: 1.4;
    min-width: 0;
    font-size: 16px;
    font-weight: 500;
  }

  .label-select option {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.5;
    background-color: var(--brew-color-surface-container-high, #2c2825);
    color: var(--brew-color-on-surface, #f0e6dd);
    padding: 12px 14px;
  }

  .label-select option:disabled {
    color: var(--brew-color-on-surface-variant, #9a8f85);
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
