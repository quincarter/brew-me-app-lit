import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import type { IBrewStep, IBrewStepsConfig } from "../../shared/interfaces/brew.interface";
import {
  addCustomStepLabel,
  knownStepLabelsSignal,
} from "../../shared/stores/custom-step-labels.store";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import "../icon/brew-icon";
import "../text-field/brew-text-field";
import { BrewStepsCardStyles } from "./brew-steps-card.styles";

/** `<select>` value that means "let me type a new label" rather than picking an existing one. */
const ADD_CUSTOM_LABEL_OPTION = "__add_custom__";

const TIMELINE_COLOR_COUNT = 4;

/**
 * # Brew Steps Card
 * A collapsible card showing a brew method's step sequence: read-only, it's
 * a proportional timeline bar over the "timed" rows (Bloom, Steep, Plunge,
 * ...) plus a pill for each row's duration or setting value. In edit mode
 * each row becomes an editable label/value pair with a per-row kind toggle
 * and remove button, plus a trailing "+ Add step".
 *
 * A *controlled* component like `brew-ratio-form`/`brew-type-picker`: it
 * owns no data besides its own expand/collapse state. `config` and
 * `editing` come from the consumer (`brew-steps.store` on the Calculator,
 * local `_edit*` state on Saved Detail), and every edit is reported via one
 * `config-change` event rather than being applied here.
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
 * @fires config-change - `CustomEvent<IBrewStepsConfig>` fired whenever a row's label/value/kind changes, or a row is added or removed.
 * @fires reset-to-preset - Fired (no payload) when the edit-mode "Reset to preset" action is activated. Controlled like `config-change` - the consumer decides what "preset" means and applies it (e.g. `resetBrewStepsToPreset()` on the Calculator).
 */
export class BrewStepsCard extends SignalWatcher(LitElement) {
  static styles = [BrewStepsCardStyles];

  @property({ type: Object }) config: IBrewStepsConfig | null = null;
  @property({ type: Boolean, reflect: true }) editing = false;
  /** Seeds the initial expanded state only; after mount the toggle owns it (same convention as `brew-recipe-card`). */
  @property({ type: Boolean, attribute: "start-open" }) startOpen = false;

  @state() private _expanded = false;
  @state() private _addingCustomLabelForRowId: string | null = null;
  @state() private _customLabelDraft = "";

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
      </div>
    `;
  }

  private _renderReadRow(step: IBrewStep): HTMLTemplateResult {
    const pillText =
      step.kind === "timed"
        ? typeof step.seconds === "number"
          ? formatSeconds(step.seconds)
          : "Now"
        : (step.value ?? "");
    // Only note rows can carry long free-text prose (timed rows only ever
    // render a formatted duration or "Now").
    const isLongNoteValue = step.kind === "note" && this._isLongNoteValue(pillText);

    return html`
      <div class="step-row">
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
      <div class="edit-row">
        <select
          class="label-select"
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

  render(): HTMLTemplateResult {
    if (!this.config) return html``;
    const steps = this.config.steps;

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
          this._expanded
            ? html`
                <div class="body">
                  ${this.editing ? nothing : this._renderTimeline(steps)}
                  <div class="steps">
                    ${steps.map((step) =>
                      this.editing ? this._renderEditRow(step) : this._renderReadRow(step),
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
