import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/aeropress-loader/brew-aeropress-loader";
import "../../components/top-bar/brew-top-bar";
import { AEROPRESS_LOADER_CYCLE_MS } from "../../components/aeropress-loader/AeropressLoader";
import { completeProviderConnect } from "../../shared/stores/cloud-sync.store";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import { OauthCallbackPageStyles } from "./oauth-callback-page.styles";

const REDIRECT_DELAY_MS = 1200;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Redirect target for every provider's OAuth flow (`/oauth/callback`) - a
 * minimal screen with no bottom nav, since it's only ever reached via a
 * full-navigation redirect back from the provider, never tapped into
 * directly. Reads `code`/`state`/`error` straight off
 * `window.location.search` (like `brew-share-page`'s query-param handling -
 * `@lit-labs/router` only hands views their *path* params). Fully
 * provider-agnostic: `completeProviderConnect` dispatches to whichever
 * provider the pending attempt's own `providerId` names, so this page never
 * needs to know which provider actually matched.
 */
@customElement("oauth-callback-page")
export class OauthCallbackPage extends LitElement {
  static styles = [OauthCallbackPageStyles];

  @state() private _message = "Connecting…";
  @state() private _isError = false;
  /** Drives the AeroPress loader - shown only while still in flight or just-finished, so a failed state reads as a plain settled message rather than an animation stuck mid-press. */
  @state() private _connecting = true;
  /** Set once the connection has actually succeeded *and* the loader has had at least one full press/drip cycle (see `AEROPRESS_LOADER_CYCLE_MS`) - drives the loader's `done` pose (cup filled, plunger held down) so a fast connection doesn't cut the animation off mid-press. */
  @state() private _done = false;

  connectedCallback(): void {
    super.connectedCallback();
    void this._completeConnection();
  }

  private async _completeConnection(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const code = params.get("code");
    const state = params.get("state");

    if (error) {
      this._fail(`Connection cancelled: ${error}`);
      return;
    }

    if (!code || !state) {
      this._fail("Missing connection details - please try again.");
      return;
    }

    try {
      // Races the real exchange against one full loader cycle so a
      // fast-resolving connection (the common case) still plays the
      // animation through once before showing the filled-cup "done" pose,
      // instead of the loader visibly cutting off mid-press. A failure
      // rejects `Promise.all` immediately without waiting for the timer -
      // bad news shouldn't be held up for the sake of the animation.
      await Promise.all([completeProviderConnect(code, state), wait(AEROPRESS_LOADER_CYCLE_MS)]);
      this._message = "Connected!";
      this._done = true;
      this._redirectToCloudSync();
    } catch (err) {
      this._fail(err instanceof Error ? err.message : "Couldn't finish connecting.");
    }
  }

  private _fail(message: string): void {
    this._isError = true;
    this._message = message;
    this._connecting = false;
    this._redirectToCloudSync();
  }

  private _redirectToCloudSync(): void {
    setTimeout(() => {
      navigateTo("/more/cloud-sync");
    }, REDIRECT_DELAY_MS);
  }

  render(): HTMLTemplateResult {
    return html`
      <div class="screen">
        <brew-top-bar title="Cloud Sync"></brew-top-bar>
        <div class="content">
          ${
            this._connecting
              ? html`<brew-aeropress-loader ?done="${this._done}"></brew-aeropress-loader>`
              : null
          }
          <p class="message ${this._isError ? "error" : ""}" role="status">${this._message}</p>
        </div>
      </div>
    `;
  }
}
