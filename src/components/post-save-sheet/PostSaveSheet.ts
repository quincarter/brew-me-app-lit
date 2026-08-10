import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { EDIT_ICON } from "../../shared/icons/icons";
import {
  closePostSaveSheet,
  postSaveSheetAlreadyOnDetailSignal,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
  requestEditBeforeBrewing,
} from "../../shared/stores/post-save-sheet.store";
import { primeTimerForSavedBrew } from "../../shared/stores/timer.store";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import "../avatar/brew-avatar";
import "../bottom-sheet/brew-bottom-sheet";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import "../icon/brew-icon";
import "../ratio-summary/brew-ratio-summary";
import { PostSaveSheetStyles } from "./post-save-sheet.styles";

/**
 * # Post Save Sheet
 * A read-only confirmation sheet shown after a plain "Save" on the
 * Calculator screen, or after "Brew again" anywhere - previews the brew and
 * offers quick actions to jump into a guided timer, view the brew's detail
 * screen, or dismiss and keep calculating. When opened from that same
 * brew's own detail screen ("Brew again" on Saved Ratio Detail), "Go to
 * brew detail" would be a no-op, so it's swapped for "Edit before brewing"
 * instead - see `postSaveSheetAlreadyOnDetailSignal`. Reads and drives
 * `post-save-sheet.store` directly, same pattern as `brew-save-sheet` and
 * its `save-dialog.store`.
 * @element brew-post-save-sheet
 */
export class PostSaveSheet extends SignalWatcher(LitElement) {
  static styles = [PostSaveSheetStyles];

  private _onStartTimer = (): void => {
    const brew = postSaveSheetBrewSignal.value;
    if (!brew) return;
    primeTimerForSavedBrew(brew);
    closePostSaveSheet();
    navigateTo("/timer");
  };

  private _onViewDetail = (): void => {
    const brew = postSaveSheetBrewSignal.value;
    if (!brew) return;
    closePostSaveSheet();
    navigateTo(`/saved/${brew.id}`);
  };

  private _onEditBeforeBrewing = (): void => {
    const brew = postSaveSheetBrewSignal.value;
    if (!brew) return;
    requestEditBeforeBrewing(brew.id);
  };

  render(): HTMLTemplateResult {
    const brew = postSaveSheetBrewSignal.value;
    if (!postSaveSheetOpenSignal.value || !brew) return html``;
    const alreadyOnDetail = postSaveSheetAlreadyOnDetailSignal.value;

    const displayName = getBrewDisplayName(brew);
    const colors = getAvatarColors(brew.id);

    return html`
      <brew-bottom-sheet
        style="--sheet-max-width: 520px"
        ?open="${postSaveSheetOpenSignal.value}"
        label="Brew saved"
        @sheet-scrim-click="${closePostSaveSheet}"
      >
        <div class="header">
          <div class="header-text">
            <brew-icon name="check_circle" size="20" filled></brew-icon>
            <span>Brew saved</span>
          </div>
          <brew-icon-button
            icon="close"
            size="18"
            aria-label="Close"
            @icon-click="${closePostSaveSheet}"
          ></brew-icon-button>
        </div>

        <div class="identity">
          <brew-avatar
            initial="${getInitial(displayName)}"
            background="${colors.background}"
            foreground="${colors.foreground}"
            size="40"
            .icon="${getBrewTypeIcon(brew.brewType, brew.icon) ?? null}"
          ></brew-avatar>
          <span class="identity-name">${displayName}</span>
        </div>

        <brew-ratio-summary
          ratio="${brew.ratio}"
          coffee="${brew.coffee}"
          water="${brew.water}"
          oz="${brew.oz}"
        ></brew-ratio-summary>

        <div class="actions">
          ${
            alreadyOnDetail
              ? html`
                  <brew-button
                    variant="outlined"
                    full-width
                    @button-click="${this._onEditBeforeBrewing}"
                    ><brew-icon .svg="${EDIT_ICON}" size="18"></brew-icon> Edit before
                    brewing</brew-button
                  >
                  <brew-button variant="filled" full-width @button-click="${this._onStartTimer}"
                    ><brew-icon name="timer" size="18"></brew-icon> Start guided timer</brew-button
                  >
                `
              : html`
                  <brew-button variant="outlined" full-width @button-click="${this._onStartTimer}"
                    ><brew-icon name="timer" size="18"></brew-icon> Start guided timer</brew-button
                  >
                  <brew-button variant="filled" full-width @button-click="${this._onViewDetail}"
                    ><brew-icon name="arrow_forward" size="18"></brew-icon> Go to brew
                    detail</brew-button
                  >
                `
          }
        </div>
      </brew-bottom-sheet>
    `;
  }
}
