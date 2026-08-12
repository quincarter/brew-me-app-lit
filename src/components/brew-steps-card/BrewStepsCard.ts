import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import type { IBrewStep, IBrewStepsConfig } from "../../shared/interfaces/brew.interface";
import type { IBrewStepProgress } from "../../shared/interfaces/timer.interface";
import {
  addCustomStepLabel,
  knownStepLabelsSignal,
} from "../../shared/stores/custom-step-labels.store";
import { getBrewStepProgress } from "../../shared/utilities/brew-step-progress.utility";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import { moveItem } from "../../shared/utilities/reorder.utility";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import "../icon/brew-icon";
import "../text-field/brew-text-field";
import { BrewStepsCardStyles } from "./brew-steps-card.styles";

/** `<select>` value that means "let me type a new label" rather than picking an existing one. */
const ADD_CUSTOM_LABEL_OPTION = "__add_custom__";

const TIMELINE_COLOR_COUNT = 4;

/**
 * `document.elementFromPoint` only pierces one level of (open) shadow DOM -
 * it returns the shadow *host* rather than descending further, so through
 * this app's several nested custom-element shells (app-shell ->
 * calculator-page -> brew-steps-card -> brew-icon-button) it resolves to
 * the outermost host and nothing more. Repeatedly hand the point to each
 * successive host's own `shadowRoot.elementFromPoint` to reach the real
 * element actually under the point.
 */
const deepElementFromPoint = (x: number, y: number): Element | null => {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const nested = el.shadowRoot.elementFromPoint(x, y);
    if (!nested || nested === el) break;
    el = nested;
  }
  return el;
};

/**
 * `Element.closest()` only searches its own shadow tree - it can't cross
 * back out through a shadow boundary to keep walking up into the host
 * document, which `deepElementFromPoint` above will have crossed *into*.
 * Same walk as `closest()`, but hops from a shadow root's top to its host
 * and keeps going instead of stopping there.
 */
const composedClosest = (start: Element | null, selector: string): HTMLElement | null => {
  let node: Element | null = start;
  while (node) {
    if (node.matches(selector)) return node as HTMLElement;
    if (node.parentElement) {
      node = node.parentElement;
      continue;
    }
    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : null;
  }
  return null;
};

/**
 * # Brew Steps Card
 * A collapsible card showing a brew method's step sequence: read-only, it's
 * a proportional timeline bar over the "timed" rows (Bloom, Steep, Plunge,
 * ...) plus a pill for each row's duration or setting value. In edit mode
 * each row becomes an editable label/value pair with a per-row kind toggle,
 * a drag handle for reordering (pointer-drag or `ArrowUp`/`ArrowDown` while
 * it's focused), and a remove button, plus a trailing "+ Add step".
 *
 * A *controlled* component like `brew-ratio-form`/`brew-type-picker`: it
 * owns no data besides its own expand/collapse state. `config` and
 * `editing` come from the consumer (`brew-steps.store` on the Calculator,
 * local `_edit*` state on Saved Detail), and every edit is reported via one
 * `config-change` event rather than being applied here.
 *
 * Passing `elapsedSeconds` (the Timer screen's live use) switches the
 * read-only view into a progress display: each timed row is marked
 * done/active/upcoming, the active row's pill counts down instead of
 * showing its total duration, and the timeline gets an elapsed-position
 * marker. Ignored while `editing`.
 * ## Usage
 * ```html
 * <brew-steps-card
 *   .config="${brewStepsSignal.value}"
 *   ?editing="${_stepsEditing}"
 *   @config-change="${(e) => updateBrewStepsConfig(e.detail)}"
 * >
 *   <brew-button slot="actions" variant="text" @button-click="${() => (_stepsEditing = !_stepsEditing)}"
 *     >${_stepsEditing ? "Done" : "Edit"}</brew-button
 *   >
 * </brew-steps-card>
 * ```
 * @element brew-steps-card
 * @slot actions - Optional trailing header content next to the expand/collapse caret, e.g. the consumer's own Edit/Done toggle button.
 * @fires config-change - `CustomEvent<IBrewStepsConfig>` fired whenever a row's label/value/kind changes, a row is added, removed, or reordered (drag or arrow-key).
 * @fires reset-to-preset - Fired (no payload) when the edit-mode "Reset to preset" action is activated. Controlled like `config-change` - the consumer decides what "preset" means and applies it (e.g. `resetBrewStepsToPreset()` on the Calculator).
 */
export class BrewStepsCard extends SignalWatcher(LitElement) {
  static styles = [BrewStepsCardStyles];

  @property({ type: Object }) config: IBrewStepsConfig | null = null;
  @property({ type: Boolean, reflect: true }) editing = false;
  /** Seeds the initial expanded state only; after mount the toggle owns it (same convention as `brew-recipe-card`). */
  @property({ type: Boolean, attribute: "start-open" }) startOpen = false;
  /** When set (and not `editing`), each timed row is shown as done/active/upcoming against this many elapsed seconds, and the timeline gets a progress marker - the Timer screen's live "honor the brew steps" view. Null renders the plain static card used on the Calculator/Saved Detail. */
  @property({ type: Number, attribute: "elapsed-seconds" }) elapsedSeconds: number | null = null;

  @state() private _expanded = false;
  @state() private _addingCustomLabelForRowId: string | null = null;
  @state() private _customLabelDraft = "";
  @state() private _openLabelMenuStepId: string | null = null;
  @state() private _openLabelMenuUpward = false;
  /** Id of the row currently being drag-reordered, or `null` when no drag is in progress. */
  @state() private _draggingId: string | null = null;
  /** Live-reordered working copy shown while a drag is in progress; `null` outside of a drag, in which case `config.steps` renders as-is. */
  @state() private _previewSteps: IBrewStep[] | null = null;

  private _seeded = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._seeded) {
      this._seeded = true;
      this._expanded = this.startOpen;
    }
  }

  /** Editing a currently-collapsed card would hide the very controls being edited, so entering edit mode always expands it. */
  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("editing") && this.editing) {
      this._expanded = true;
    }
  }

  private _toggleExpanded = (): void => {
    this._expanded = !this._expanded;
  };

  private _emitChange(steps: IBrewStep[]): void {
    this.dispatchEvent(
      new CustomEvent<IBrewStepsConfig>("config-change", {
        detail: { steps },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _updateRow(id: string, patch: Partial<IBrewStep>): void {
    if (!this.config) return;
    this._emitChange(
      this.config.steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
  }

  private _toggleLabelMenu(stepId: string, event: Event): void {
    if (this._openLabelMenuStepId === stepId) {
      this._openLabelMenuStepId = null;
      return;
    }
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    this._openLabelMenuUpward = spaceBelow < 260 && rect.top > spaceBelow;
    this._openLabelMenuStepId = stepId;
  }

  private _closeLabelMenu = (): void => {
    this._openLabelMenuStepId = null;
  };

  private _selectLabelOption(step: IBrewStep, value: string): void {
    this._openLabelMenuStepId = null;
    if (value === ADD_CUSTOM_LABEL_OPTION) {
      this._addingCustomLabelForRowId = step.id;
      this._customLabelDraft = "";
      return;
    }
    this._updateRow(step.id, { label: value });
  }

  private _onLabelSelect(row: IBrewStep, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === ADD_CUSTOM_LABEL_OPTION) {
      this._addingCustomLabelForRowId = row.id;
      this._customLabelDraft = "";
      return;
    }
    this._updateRow(row.id, { label: value });
  }

  private _confirmCustomLabel(row: IBrewStep): void {
    const added = addCustomStepLabel(this._customLabelDraft);
    if (added) this._updateRow(row.id, { label: added });
    this._addingCustomLabelForRowId = null;
    this._customLabelDraft = "";
  }

  private _cancelCustomLabel = (): void => {
    this._addingCustomLabelForRowId = null;
    this._customLabelDraft = "";
  };

  private _onValueInput(row: IBrewStep, value: string): void {
    if (row.kind === "timed") {
      const parsed = Number.parseFloat(value);
      this._updateRow(row.id, {
        seconds: value === "" || Number.isNaN(parsed) ? null : Math.max(0, Math.round(parsed)),
      });
      return;
    }
    this._updateRow(row.id, { value });
  }

  private _toggleKind(row: IBrewStep): void {
    const kind = row.kind === "timed" ? "note" : "timed";
    this._updateRow(row.id, {
      kind,
      seconds: kind === "timed" ? (row.seconds ?? 30) : undefined,
      value: kind === "note" ? (row.value ?? "") : undefined,
    });
  }

  private _removeRow(id: string): void {
    if (!this.config) return;
    this._emitChange(this.config.steps.filter((step) => step.id !== id));
  }

  private _addRow = (): void => {
    const newRow: IBrewStep = {
      id: crypto.randomUUID(),
      label: "",
      kind: "note",
      value: "",
    };
    this._emitChange([...(this.config?.steps ?? []), newRow]);
  };

  private _resetToPreset = (): void => {
    this.dispatchEvent(new CustomEvent("reset-to-preset", { bubbles: true, composed: true }));
  };

  /**
   * Which `.edit-row`'s `data-step-id` sits under a viewport point, or
   * `null` if none does. Goes through `deepElementFromPoint`/
   * `composedClosest` rather than plain `elementFromPoint`/`closest` -
   * this card sits several nested shadow roots deep (app-shell ->
   * calculator-page -> brew-steps-card -> brew-icon-button), and both
   * plain DOM APIs stop at the first shadow boundary. Pulled out on its
   * own so a test can stub `document.elementFromPoint` (a plain
   * reassignable function, even under happy-dom) to drive a full drag
   * without needing real layout/geometry.
   */
  private _rowIdAtPoint(x: number, y: number): string | null {
    const target = deepElementFromPoint(x, y);
    const row = composedClosest(target, ".edit-row");
    return row?.dataset.stepId ?? null;
  }

  /** Starts a drag: capture the pointer on the handle itself so move/up events keep targeting it even once the pointer leaves the handle's bounds. */
  private _onDragHandlePointerDown(step: IBrewStep, event: PointerEvent): void {
    this._draggingId = step.id;
    this._previewSteps = [...(this.config?.steps ?? [])];
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  private _onDragHandlePointerMove = (event: PointerEvent): void => {
    if (!this._draggingId || !this._previewSteps) return;
    const overId = this._rowIdAtPoint(event.clientX, event.clientY);
    if (!overId || overId === this._draggingId) return;

    const fromIndex = this._previewSteps.findIndex((step) => step.id === this._draggingId);
    const toIndex = this._previewSteps.findIndex((step) => step.id === overId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    this._previewSteps = moveItem(this._previewSteps, fromIndex, toIndex);
  };

  /** Ends a drag (drop or cancel): report the reorder like any other edit if the order actually changed, then clear drag state. */
  private _endDrag = (): void => {
    if (this._draggingId && this._previewSteps) {
      const originalOrder = (this.config?.steps ?? []).map((step) => step.id).join("|");
      const previewOrder = this._previewSteps.map((step) => step.id).join("|");
      if (originalOrder !== previewOrder) this._emitChange(this._previewSteps);
    }
    this._draggingId = null;
    this._previewSteps = null;
  };

  /** Keyboard equivalent of dragging - the primary way keyboard/screen-reader users reorder rows, applied immediately with no gesture required. */
  private _onDragHandleKeydown(step: IBrewStep, event: KeyboardEvent): void {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();

    const steps = this.config?.steps ?? [];
    const fromIndex = steps.findIndex((s) => s.id === step.id);
    if (fromIndex === -1) return;

    const toIndex = event.key === "ArrowUp" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= steps.length) return;

    this._emitChange(moveItem(steps, fromIndex, toIndex));
  }

  /**
   * Short setting values ("Standard", "Inverted", "Paper", ...) fit the
   * fixed-height pill fine; full WAC recipe prose ("At 50s, begin gently
   * pressing for about 20 seconds.") would overflow/clip it. There's no
   * fully reliable heuristic, but "long or multi-word" is a good proxy
   * since every curated setting value in this app is a single short word.
   */
  private static readonly LONG_NOTE_VALUE_THRESHOLD = 24;

  private _isLongNoteValue(value: string): boolean {
    return value.length > BrewStepsCard.LONG_NOTE_VALUE_THRESHOLD || value.includes(" ");
  }

  private _labelOptions(currentLabel: string): string[] {
    const known = knownStepLabelsSignal.value;
    return currentLabel && !known.includes(currentLabel) ? [currentLabel, ...known] : known;
  }

  private _renderTimeline(steps: IBrewStep[]): HTMLTemplateResult | typeof nothing {
    const timed = steps.filter(
      (step): step is IBrewStep & { seconds: number } =>
        step.kind === "timed" && typeof step.seconds === "number" && step.seconds > 0,
    );
    if (timed.length === 0) return nothing;

    const totalSeconds = timed.reduce((sum, step) => sum + step.seconds, 0);
    const progressPercent =
      !this.editing && this.elapsedSeconds !== null && totalSeconds > 0
        ? Math.min(100, (this.elapsedSeconds / totalSeconds) * 100)
        : null;

    return html`
      <div class="timeline">
        ${timed.map(
          (step, index) => html`
            <span
              class="timeline-segment segment-${index % TIMELINE_COLOR_COUNT}"
              style="flex-grow:${step.seconds}"
              title="${step.label} · ${formatSeconds(step.seconds)}"
            ></span>
          `,
        )}
        ${
          progressPercent !== null
            ? html`<span class="timeline-progress" style="left:${progressPercent}%"></span>`
            : nothing
        }
      </div>
    `;
  }

  private _renderReadRow(
    step: IBrewStep,
    progressRow: IBrewStepProgress | null,
  ): HTMLTemplateResult {
    const status = progressRow?.status ?? null;
    const remainingSeconds =
      status === "active" && this.elapsedSeconds !== null && typeof step.seconds === "number"
        ? // `elapsedSeconds` is total time since the timer started, not time
          // within this step - subtract the step's own cumulative start
          // offset first, or every step but the first would show a
          // remaining time that's short by however long the prior steps took.
          Math.max(0, step.seconds - (this.elapsedSeconds - (progressRow?.startSeconds ?? 0)))
        : null;
    const pillText =
      step.kind === "timed"
        ? typeof step.seconds === "number"
          ? remainingSeconds !== null
            ? `${formatSeconds(remainingSeconds)} left`
            : formatSeconds(step.seconds)
          : "Now"
        : (step.value ?? "");
    // Only note rows can carry long free-text prose (timed rows only ever
    // render a formatted duration, remaining time, or "Now").
    const isLongNoteValue = step.kind === "note" && this._isLongNoteValue(pillText);

    return html`
      <div class="step-row ${status ? `step-${status}` : ""}">
        ${
          status === "done"
            ? html`<brew-icon class="step-check" name="check_circle" size="18"></brew-icon>`
            : nothing
        }
        <div class="step-text">
          <span class="step-label">${step.label}</span>
          ${step.note ? html`<span class="step-note">${step.note}</span>` : nothing}
          ${isLongNoteValue ? html`<span class="step-note-value">${pillText}</span>` : nothing}
        </div>
        ${
          pillText && !isLongNoteValue
            ? html`<span class="pill pill-${step.kind}">${pillText}</span>`
            : nothing
        }
      </div>
    `;
  }

  private _renderEditRow(step: IBrewStep): HTMLTemplateResult {
    return html`
      <div
        class="edit-row ${this._draggingId === step.id ? "dragging" : ""}"
        data-step-id="${step.id}"
      >
        <brew-icon-button
          class="drag-handle"
          icon="drag_indicator"
          size="18"
          aria-label="Reorder ${step.label || "step"} - use arrow keys or drag"
          @pointerdown="${(e: PointerEvent) => this._onDragHandlePointerDown(step, e)}"
          @pointermove="${this._onDragHandlePointerMove}"
          @pointerup="${this._endDrag}"
          @pointercancel="${this._endDrag}"
          @keydown="${(e: KeyboardEvent) => this._onDragHandleKeydown(step, e)}"
        ></brew-icon-button>

        <div class="label-picker-container">
          <button
            class="label-select-btn"
            type="button"
            aria-haspopup="listbox"
            aria-expanded="${this._openLabelMenuStepId === step.id}"
            @click="${(e: Event) => this._toggleLabelMenu(step.id, e)}"
          >
            <span class="label-select-text ${!step.label ? "placeholder" : ""}">
              ${step.label || "Choose a label…"}
            </span>
            <brew-icon name="arrow_drop_down" size="18"></brew-icon>
          </button>

          <!-- Hidden select kept for backwards compatibility with tests & form bindings -->
          <select
            class="label-select"
            style="display: none;"
            .value="${step.label}"
            @change="${(e: Event) => this._onLabelSelect(step, e)}"
          >
            <option value="" disabled ?selected="${!step.label}">Choose a label…</option>
            ${this._labelOptions(step.label).map(
              (label) => html`<option value="${label}" ?selected="${label === step.label}">
                ${label}
              </option>`,
            )}
            <option value="${ADD_CUSTOM_LABEL_OPTION}">Add custom…</option>
          </select>

          ${
            this._openLabelMenuStepId === step.id
              ? html`
                  <div class="label-menu-overlay" @click="${this._closeLabelMenu}"></div>
                  <div
                    class="label-menu-dropdown ${this._openLabelMenuUpward ? "upward" : ""}"
                    role="listbox"
                  >
                    ${this._labelOptions(step.label).map(
                      (label) => html`
                        <button
                          class="label-menu-item ${label === step.label ? "selected" : ""}"
                          type="button"
                          role="option"
                          aria-selected="${label === step.label}"
                          @click="${() => this._selectLabelOption(step, label)}"
                        >
                          <span class="item-text">${label}</span>
                          ${
                            label === step.label
                              ? html`<brew-icon name="check" size="18"></brew-icon>`
                              : nothing
                          }
                        </button>
                      `,
                    )}
                    <button
                      class="label-menu-item add-custom-item"
                      type="button"
                      @click="${() => this._selectLabelOption(step, ADD_CUSTOM_LABEL_OPTION)}"
                    >
                      <brew-icon name="add" size="18"></brew-icon>
                      <span class="item-text">Add custom…</span>
                    </button>
                  </div>
                `
              : nothing
          }
        </div>

        ${
          step.kind === "timed"
            ? html`
                <input
                  class="value-input"
                  type="number"
                  min="0"
                  placeholder="Seconds"
                  aria-label="Duration in seconds"
                  .value="${step.seconds ?? ""}"
                  @input="${(e: Event) => this._onValueInput(step, (e.target as HTMLInputElement).value)}"
                />
              `
            : html`
                <input
                  class="value-input"
                  type="text"
                  placeholder="Value"
                  aria-label="Step value"
                  .value="${step.value ?? ""}"
                  @input="${(e: Event) => this._onValueInput(step, (e.target as HTMLInputElement).value)}"
                />
              `
        }

        <button
          class="kind-toggle"
          type="button"
          aria-label="Switch to ${step.kind === "timed" ? "note" : "timed"} step"
          @click="${() => this._toggleKind(step)}"
        >
          ${step.kind === "timed" ? "Timed" : "Note"}
        </button>

        <brew-icon-button
          icon="delete"
          size="18"
          aria-label="Remove step"
          @icon-click="${() => this._removeRow(step.id)}"
        ></brew-icon-button>
      </div>

      ${
        this._addingCustomLabelForRowId === step.id
          ? html`
              <div class="custom-label-row">
                <brew-text-field
                  label="New step label"
                  .value="${this._customLabelDraft}"
                  @value-change="${(e: CustomEvent<string>) => {
                    this._customLabelDraft = e.detail;
                  }}"
                ></brew-text-field>
                <div class="custom-label-actions">
                  <brew-button variant="text" @button-click="${this._cancelCustomLabel}"
                    >Cancel</brew-button
                  >
                  <brew-button
                    variant="filled"
                    ?disabled="${!this._customLabelDraft.trim()}"
                    @button-click="${() => this._confirmCustomLabel(step)}"
                    >Add</brew-button
                  >
                </div>
              </div>
            `
          : nothing
      }
    `;
  }

  private _renderCondensedCue(
    steps: IBrewStep[],
    progress: IBrewStepProgress[] | null,
  ): HTMLTemplateResult | typeof nothing {
    if (steps.length === 0) return nothing;

    const activeRow = progress?.find((row) => row.status === "active");
    if (activeRow) {
      const step = activeRow.step;
      const remainingSeconds =
        step.kind === "timed" && typeof step.seconds === "number" && this.elapsedSeconds !== null
          ? Math.max(0, step.seconds - (this.elapsedSeconds - activeRow.startSeconds))
          : null;
      const pillText =
        step.kind === "timed"
          ? remainingSeconds !== null
            ? `${formatSeconds(remainingSeconds)} left`
            : "Now"
          : (step.value ?? "");

      return html`
        <div class="condensed-cue">
          <div class="cue-text">
            <span class="cue-label">${step.label}</span>
            ${step.note ? html`<span class="cue-note">${step.note}</span>` : nothing}
          </div>
          ${pillText ? html`<span class="pill pill-${step.kind}">${pillText}</span>` : nothing}
        </div>
      `;
    }

    const hasTimed = steps.some((s) => s.kind === "timed");
    const totalTimedSeconds = steps
      .filter(
        (s): s is IBrewStep & { seconds: number } =>
          s.kind === "timed" && typeof s.seconds === "number",
      )
      .reduce((sum, s) => sum + s.seconds, 0);

    if (hasTimed && this.elapsedSeconds !== null && this.elapsedSeconds >= totalTimedSeconds) {
      return html`
        <div class="condensed-cue">
          <div class="cue-text">
            <span class="cue-label">All steps complete</span>
          </div>
          <span class="pill pill-timed">Done</span>
        </div>
      `;
    }

    const firstStep = steps.find((s) => s.kind === "timed") ?? steps[0];
    if (!firstStep) return nothing;

    const durationText =
      firstStep.kind === "timed" && typeof firstStep.seconds === "number"
        ? formatSeconds(firstStep.seconds)
        : (firstStep.value ?? "");

    return html`
      <div class="condensed-cue">
        <div class="cue-text">
          <span class="cue-label">${firstStep.label}</span>
          ${firstStep.note ? html`<span class="cue-note">${firstStep.note}</span>` : nothing}
        </div>
        ${
          durationText
            ? html`<span class="pill pill-${firstStep.kind}">${durationText}</span>`
            : nothing
        }
      </div>
    `;
  }

  render(): HTMLTemplateResult {
    if (!this.config) return html``;
    const steps = this.config.steps;
    // Dragging only happens in edit mode; outside it, this is just `steps`.
    const displaySteps = this.editing ? (this._previewSteps ?? steps) : steps;
    // Live done/active/upcoming status only applies to the static read view - editing shows the plain preset-agnostic form instead.
    const progress =
      !this.editing && this.elapsedSeconds !== null
        ? getBrewStepProgress(steps, this.elapsedSeconds)
        : null;

    return html`
      <div class="card ${this._expanded ? "expanded" : ""}">
        <div class="header">
          <span class="title">Brew Steps</span>
          <slot name="actions"></slot>
          <button
            class="caret-btn"
            type="button"
            aria-expanded="${this._expanded}"
            aria-label="${this._expanded ? "Collapse" : "Expand"} Brew Steps"
            @click="${this._toggleExpanded}"
          >
            <brew-icon name="${this._expanded ? "expand_less" : "expand_more"}"></brew-icon>
          </button>
        </div>

        ${
          !this.editing
            ? html`
                <div class="condensed-body">
                  ${this._renderTimeline(steps)}
                  ${!this._expanded ? this._renderCondensedCue(steps, progress) : nothing}
                </div>
              `
            : nothing
        }
        ${
          this._expanded
            ? html`
                <div class="body">
                  ${this.editing ? this._renderTimeline(steps) : nothing}
                  <div class="steps">
                    ${displaySteps.map((step) =>
                      this.editing
                        ? this._renderEditRow(step)
                        : this._renderReadRow(
                            step,
                            progress?.find((row) => row.step.id === step.id) ?? null,
                          ),
                    )}
                  </div>
                  ${
                    this.editing
                      ? html`
                          <div class="edit-footer">
                            <brew-button variant="text" @button-click="${this._addRow}"
                              ><brew-icon name="add" size="18"></brew-icon> Add step</brew-button
                            >
                            <brew-button variant="text" @button-click="${this._resetToPreset}"
                              >Reset to preset</brew-button
                            >
                          </div>
                        `
                      : nothing
                  }
                </div>
              `
            : nothing
        }
      </div>
    `;
  }
}
