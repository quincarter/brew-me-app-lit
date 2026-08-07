import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon/brew-icon";
import "../../components/save-sheet/brew-save-sheet";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import {
  coffeeSignal,
  ozSignal,
  ratioSignal,
  resetCalculator,
  setOz,
  setRatio,
  setWater,
  tipOpenSignal,
  toggleTip,
  waterSignal,
} from "../../shared/stores/calculator.store";
import { openSaveDialog } from "../../shared/stores/save-dialog.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { CalculatorPageStyles } from "./calculator-page.styles";

@customElement("calculator-page")
export class CalculatorPage extends SignalWatcher(LitElement) {
  static styles = [CalculatorPageStyles, responsiveScreenStyles];

  render(): HTMLTemplateResult {
    const coffee = coffeeSignal.value;
    const water = waterSignal.value;
    const oz = ozSignal.value;
    const isValid = Boolean(water && oz && coffee);

    return html`
      <div class="screen">
        <brew-top-bar title="Calculator"></brew-top-bar>

        <div class="content">
          <brew-text-field
            label="Water : Coffee ratio"
            type="number"
            suffix-text=":1"
            .value="${ratioSignal.value}"
            @value-change="${(e: CustomEvent<string>) => setRatio(e.detail)}"
          ></brew-text-field>
          <p class="hint">
            Defaults to 16:1 for pour-over &amp; drip. Try 2:1 for espresso, 3–5:1 for cold brew.
          </p>

          <div class="row">
            <brew-text-field
              label="Water (g)"
              type="number"
              .value="${water}"
              @value-change="${(e: CustomEvent<string>) => setWater(e.detail)}"
            ></brew-text-field>
            <brew-text-field
              label="Cup size (oz)"
              type="number"
              .value="${oz}"
              @value-change="${(e: CustomEvent<string>) => setOz(e.detail)}"
            ></brew-text-field>
          </div>
          <p class="hint">These two fields update each other automatically.</p>

          ${
            coffee !== null
              ? html`
                  <div class="result">
                    <div class="result-label">Coffee needed</div>
                    <div class="result-value">${coffee}g</div>
                  </div>
                `
              : null
          }

          <div class="row actions">
            <brew-button variant="outlined" full-width @button-click="${resetCalculator}"
              >Reset</brew-button
            >
            <brew-button
              variant="filled"
              full-width
              ?disabled="${!isValid}"
              @button-click="${openSaveDialog}"
              >Save ratio</brew-button
            >
          </div>

          <div class="tips">
            <button class="tips-toggle" type="button" @click="${toggleTip}">
              <brew-icon name="info" size="20"></brew-icon>
              <span class="tips-label">Ratio tips</span>
              <brew-icon name="${tipOpenSignal.value ? "expand_less" : "expand_more"}"></brew-icon>
            </button>
            ${
              tipOpenSignal.value
                ? html`
                    <p class="tips-body">
                      Lower ratio = stronger, more intense brew. Higher ratio = weaker, lighter cup.
                      Pour-over/drip: 15–18:1 · Espresso: ~2:1 · Cold brew: 3–5:1. Adjust to taste.
                    </p>
                  `
                : null
            }
          </div>
        </div>

        <brew-bottom-nav active="calculate"></brew-bottom-nav>
        <brew-save-sheet></brew-save-sheet>
      </div>
    `;
  }
}
