import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { ChemexLoaderStyles } from "./chemex-loader.styles";

/**
 * One full pour-flow-ripple loop, in ms - kept in sync with `--chemex-cycle`
 * in `chemex-loader.styles.ts`. See `AEROPRESS_LOADER_CYCLE_MS`'s doc
 * comment in `AeropressLoader.ts` for why this can't be derived from the CSS
 * automatically. A caller racing real async work against this loader should
 * wait at least this long before switching `done` on.
 */
export const CHEMEX_LOADER_CYCLE_MS = 2800;

/**
 * # Chemex Loader
 * A pure-CSS loading indicator shaped like a Chemex: the hourglass glass
 * vessel (a wide cone top, a wood collar at the waist, a rounded bulb
 * below), a bed of grounds sitting in the paper filter, a pulse of water
 * poured over them, and coffee collecting in the bulb below - not a
 * separate cup, since a Chemex brews directly into its own vessel. Used
 * wherever the app is waiting on something in the background, on-brand with
 * the rest of the app's coffee illustrations.
 * `aria-hidden` on the root - purely decorative, so callers pair it with
 * their own visible/screen-reader status text.
 * @element brew-chemex-loader
 * @attr {boolean} done - Stops the pour loop and fills the bulb further -
 * the "finished brewing" pose. Callers should hold off setting this until at
 * least `CHEMEX_LOADER_CYCLE_MS` has elapsed, so the loop always plays
 * through once before finishing.
 */
export class ChemexLoader extends LitElement {
  static styles = [ChemexLoaderStyles];

  @property({ type: Boolean, reflect: true }) done = false;

  render(): HTMLTemplateResult {
    return html`
      <div class="chemex-loader" aria-hidden="true">
        <div class="pour"></div>
        <div class="cone"></div>
        <div class="grounds"></div>
        <div class="collar"></div>
        <div class="neck"></div>
        <div class="flow"></div>
        <div class="bulb">
          <div class="bulb-liquid"></div>
        </div>
      </div>
    `;
  }
}
