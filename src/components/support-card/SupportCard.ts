import { type HTMLTemplateResult, html, LitElement } from "lit";
import { SupportCardStyles } from "./support-card.styles";

const BUY_ME_A_COFFEE_URL = "https://www.buymeacoffee.com/quincarter7";
const BUY_ME_A_COFFEE_BUTTON_IMAGE = "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png";

/**
 * # Support Card
 * A small, warm "if this app's been useful, here's how to support it" card -
 * BrewMe is free with no ads or paywall, so this is the one place the app
 * asks for anything. Shown on Home and in Settings; deliberately not
 * repeated on every screen so it doesn't nag.
 * @element brew-support-card
 */
export class SupportCard extends LitElement {
  static styles = [SupportCardStyles];

  render(): HTMLTemplateResult {
    return html`
      <div class="support-card">
        <p class="support-message">
          BrewMe is free to use, no strings attached. I've put a lot of care into building and
          maintaining it in my spare time because I love good coffee and wanted a tool worth using
          myself - if it's earned a place in your routine, a coffee back means a lot. Thank you for
          brewing with me.
        </p>
        <a class="bmc-link" href="${BUY_ME_A_COFFEE_URL}" target="_blank" rel="noopener noreferrer">
          <img
            class="bmc-image"
            src="${BUY_ME_A_COFFEE_BUTTON_IMAGE}"
            alt="Buy me a coffee"
            width="217"
            height="60"
          />
        </a>
      </div>
    `;
  }
}
