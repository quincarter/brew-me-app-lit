import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { AeropressLoaderStyles } from "./aeropress-loader.styles";

/**
 * One full press-flow-ripple loop, in ms - kept in sync with
 * `--aeropress-cycle` in `aeropress-loader.styles.ts` (both values must
 * match; there's no single source of truth across CSS and JS for a
 * `<style>`-defined animation-duration). A caller racing real async work
 * against this loader (e.g. `oauth-callback-page`) should wait at least this
 * long before switching `done` on, so the animation always completes at
 * least one full cycle instead of visibly cutting off mid-press.
 */
export const AEROPRESS_LOADER_CYCLE_MS = 2400;

/**
 * # Aeropress Loader
 * A pure-CSS loading indicator shaped like an AeroPress: a straight-walled
 * chamber with a flared filter cap resting right at the cup's rim (the
 * chamber nests into the cup, the way a real AeroPress does when brewing
 * directly onto a mug - not suspended above it like a pour-over dripper), a
 * plunger that pumps down toward that cap, and the cup's coffee level rising
 * as it presses. Used wherever the app is waiting on something in the
 * background (e.g. the OAuth callback screen while a cloud sync connection
 * completes) instead of a generic spinner or bare "Loading…" text, on-brand
 * with the rest of the app's coffee illustrations.
 * `aria-hidden` on the root - purely decorative, so callers pair it with
 * their own visible/screen-reader status text (see `oauth-callback-page`).
 * @element brew-aeropress-loader
 * @attr {boolean} done - Stops the press loop and fills the cup to the
 * brim - the "finished" pose. Callers should hold off setting this until at
 * least `AEROPRESS_LOADER_CYCLE_MS` has elapsed (see that constant's doc
 * comment), so the loop always plays through once before finishing.
 */
export class AeropressLoader extends LitElement {
  static styles = [AeropressLoaderStyles];

  @property({ type: Boolean, reflect: true }) done = false;

  render(): HTMLTemplateResult {
    return html`
      <div class="aeropress-loader" aria-hidden="true">
        <div class="plunger">
          <div class="plunger-rod"></div>
          <div class="plunger-cap"></div>
        </div>
        <div class="chamber">
          <div class="chamber-liquid"></div>
        </div>
        <div class="filter-cap"></div>
        <div class="flow"></div>
        <div class="cup">
          <div class="cup-liquid"></div>
          <div class="cup-handle"></div>
        </div>
      </div>
    `;
  }
}
