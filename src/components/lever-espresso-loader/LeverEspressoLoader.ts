import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { LeverEspressoLoaderStyles } from "./lever-espresso-loader.styles";

/**
 * One full pull-shot-ripple loop, in ms - kept in sync with
 * `--lever-espresso-cycle` in `lever-espresso-loader.styles.ts`. See
 * `AEROPRESS_LOADER_CYCLE_MS`'s doc comment in `AeropressLoader.ts` for why
 * this can't be derived from the CSS automatically. A caller racing real
 * async work against this loader should wait at least this long before
 * switching `done` on.
 */
export const LEVER_ESPRESSO_LOADER_CYCLE_MS = 2200;

/**
 * # Lever Espresso Loader
 * A pure-CSS loading indicator shaped like a spring-lever espresso machine:
 * the boiler body, a lever pivoting down to build pressure then springing
 * back, a portafilter with a spout, a fine dark shot streaming out, and a
 * small cup catching it with a distinct lighter crema layer riding on top
 * of the espresso - the detail that reads as "espresso" rather than just
 * "coffee." Used wherever the app is waiting on something in the
 * background, on-brand with the rest of the app's coffee illustrations.
 * `aria-hidden` on the root - purely decorative, so callers pair it with
 * their own visible/screen-reader status text.
 * @element brew-lever-espresso-loader
 * @attr {boolean} done - Stops the pull loop with the lever held down and
 * fills the cup further - the "finished" pose. Callers should hold off
 * setting this until at least `LEVER_ESPRESSO_LOADER_CYCLE_MS` has elapsed,
 * so the loop always plays through once before finishing.
 */
export class LeverEspressoLoader extends LitElement {
  static styles = [LeverEspressoLoaderStyles];

  @property({ type: Boolean, reflect: true }) done = false;

  render(): HTMLTemplateResult {
    return html`
      <div class="lever-espresso-loader" aria-hidden="true">
        <div class="machine-body"></div>
        <div class="lever"></div>
        <div class="group-head"></div>
        <div class="portafilter"></div>
        <div class="spout"></div>
        <div class="shot"></div>
        <div class="cup">
          <div class="espresso-liquid">
            <div class="crema"></div>
          </div>
          <div class="cup-handle"></div>
        </div>
      </div>
    `;
  }
}
