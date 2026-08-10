import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { savedBrewsSignal } from "../../shared/stores/brew.store";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import { formatRatio } from "../../shared/utilities/format-ratio.utility";
import "../bottom-sheet/brew-bottom-sheet";
import "../list-row/brew-list-row";
import { SavedBrewPickerSheetStyles } from "./saved-brew-picker-sheet.styles";

/**
 * # Saved Brew Picker Sheet
 * A `<brew-bottom-sheet>` listing every saved brew (`savedBrewsSignal`,
 * newest-activity first), as a tappable row. Picking one fires
 * `saved-brew-select` with the full brew so the consumer (the Timer
 * screen's idle "choose from saved brews" action) can prime itself - same
 * "dumb shell + one event" shape `brew-recipe-picker-sheet` uses for
 * loading a WAC recipe.
 * @element brew-saved-brew-picker-sheet
 * @fires saved-brew-select - `CustomEvent<ISavedBrew>` fired with the tapped brew. Consumers are responsible for closing the sheet.
 */
export class SavedBrewPickerSheet extends SignalWatcher(LitElement) {
  static styles = [SavedBrewPickerSheetStyles];

  @property({ type: Boolean }) open = false;

  private _select(event: Event, brew: ISavedBrew): void {
    // Suppresses `brew-list-row`'s default navigation (it renders as an <a>)
    // before the router's own document-level click listener sees it.
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent<ISavedBrew>("saved-brew-select", {
        detail: brew,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render(): HTMLTemplateResult {
    if (!this.open) return html``;

    const brews = [...savedBrewsSignal.value].sort(
      (a, b) => (b.lastBrewedAt ?? b.createdAt) - (a.lastBrewedAt ?? a.createdAt),
    );

    return html`
      <brew-bottom-sheet ?open="${this.open}" label="Choose a saved brew">
        <div class="title">Choose a saved brew</div>
        ${
          brews.length === 0
            ? html`<p class="hint">No saved brews yet.</p>`
            : html`
                <p class="hint">Primes the timer with this brew's numbers and steps.</p>
                <div class="list">
                  ${brews.map((brew) => {
                    return html`
                      <brew-list-row
                        headline="${getBrewDisplayName(brew)} · ${formatRatio(brew.ratio)}"
                        supporting="${brew.coffee}g coffee · ${brew.water}g water"
                        leading-initial="${getBrewDisplayName(brew).charAt(0)}"
                        .avatarIcon="${getBrewTypeIcon(brew.brewType, brew.icon) ?? null}"
                        @click="${(e: Event) => this._select(e, brew)}"
                      ></brew-list-row>
                    `;
                  })}
                </div>
              `
        }
      </brew-bottom-sheet>
    `;
  }
}
