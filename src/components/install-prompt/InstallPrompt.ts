import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import {
  canShowInstallPromptSignal,
  dismissInstallPrompt,
  promptInstall,
} from "../../shared/stores/install-prompt.store";
import "../bottom-sheet/brew-bottom-sheet";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import { InstallPromptStyles } from "./install-prompt.styles";

/**
 * # Install Prompt
 * A `<brew-bottom-sheet>` (centered card at expanded widths, same pattern as
 * `brew-save-sheet`/`brew-post-save-sheet`) that replaces the browser's
 * default install UI. It only ever renders open once `beforeinstallprompt`
 * has actually fired - see `install-prompt.store.ts` - and shows the real
 * app icon plus two screen previews so the person can see what they're
 * installing before committing. Reusing the shared sheet shell (rather than
 * this component's own scrim, as before) means Escape/backdrop-click
 * dismissal comes for free from `<brew-bottom-sheet>`'s native `<dialog>`.
 * @element brew-install-prompt
 */
export class InstallPrompt extends SignalWatcher(LitElement) {
  static styles = [InstallPromptStyles];

  private _install = async (): Promise<void> => {
    await promptInstall();
  };

  render(): HTMLTemplateResult {
    return html`
      <brew-bottom-sheet
        ?open="${canShowInstallPromptSignal.value}"
        label="Install BrewMe"
        @sheet-scrim-click="${dismissInstallPrompt}"
      >
        <div class="header">
          <brew-icon-button
            icon="close"
            aria-label="Not now"
            @icon-click="${dismissInstallPrompt}"
          ></brew-icon-button>
        </div>

        <div class="previews">
          <img class="preview" src="/screenshots/home.png" alt="BrewMe home screen" />
          <img
            class="preview"
            src="/screenshots/calculator.png"
            alt="BrewMe ratio calculator screen"
          />
        </div>

        <div class="identity">
          <img class="app-icon" src="/icons/icon-192x192.png" alt="" width="56" height="56" />
          <div class="identity-text">
            <div class="app-name">BrewMe</div>
            <div class="app-url">brewme.app</div>
          </div>
        </div>

        <p class="pitch">
          Install BrewMe for a full-screen app experience that works offline, right from your home
          screen.
        </p>

        <div class="actions">
          <brew-button variant="text" @button-click="${dismissInstallPrompt}">Not now</brew-button>
          <brew-button variant="filled" @button-click="${this._install}">Install</brew-button>
        </div>
      </brew-bottom-sheet>
    `;
  }
}
