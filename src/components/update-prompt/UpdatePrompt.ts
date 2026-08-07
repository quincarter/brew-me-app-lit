import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import {
  applyUpdate,
  dismissUpdatePrompt,
  needsRefreshSignal,
} from "../../shared/utilities/register-service-worker.utility";
import "../button/brew-button";
import { UpdatePromptStyles } from "./update-prompt.styles";

/**
 * # Update Prompt
 * A small floating snackbar (not a modal - no scrim, doesn't block the
 * rest of the app) that appears once a new service worker has installed
 * and is waiting to activate. "Refresh" applies it immediately; "Later"
 * dismisses the banner for this session, and it reappears on the next
 * visit if the update's still pending.
 * @element brew-update-prompt
 */
export class UpdatePrompt extends SignalWatcher(LitElement) {
  static styles = [UpdatePromptStyles];

  render(): HTMLTemplateResult {
    if (!needsRefreshSignal.value) return html``;

    return html`
      <div class="toast" role="status">
        <span class="toast-text">A new version of BrewMe is ready.</span>
        <div class="toast-actions">
          <brew-button variant="text" @button-click="${dismissUpdatePrompt}">Later</brew-button>
          <brew-button variant="filled" @button-click="${applyUpdate}">Refresh</brew-button>
        </div>
      </div>
    `;
  }
}
