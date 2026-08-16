import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { CollapsibleBannerStyles } from "./collapsible-banner.styles";

/**
 * # Collapsible Banner
 * A generic animated show/hide wrapper for an inline (non-modal) banner. Stays mounted
 * regardless of `open` so a CSS grid-rows/opacity transition can actually play on both
 * entrance and exit - a consumer that instead removes this element from its own template
 * the instant it should close (e.g. `${open ? html\`<brew-collapsible-banner>...\` : nothing}`)
 * would skip the exit animation entirely, since Lit tears the whole subtree down
 * synchronously on that render. `inert` is toggled in lockstep with `open` (not waited on)
 * so collapsed content can't be focused or clicked mid-fade or once fully closed.
 * @element brew-collapsible-banner
 * @slot - Banner content.
 */
export class CollapsibleBanner extends LitElement {
  static styles = [CollapsibleBannerStyles];

  @property({ type: Boolean, reflect: true }) open = false;

  render(): HTMLTemplateResult {
    return html`
      <div class="row" ?inert="${!this.open}">
        <div class="inner"><slot></slot></div>
      </div>
    `;
  }
}
