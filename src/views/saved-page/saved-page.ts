import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/empty-state/brew-empty-state";
import "../../components/list-row/brew-list-row";
import "../../components/top-bar/brew-top-bar";
import { savedBrewsSignal } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { SavedPageStyles } from "./saved-page.styles";

@customElement("saved-page")
export class SavedPage extends SignalWatcher(LitElement) {
  static styles = [SavedPageStyles, responsiveScreenStyles];

  render(): HTMLTemplateResult {
    const brews = savedBrewsSignal.value;

    return html`
      <div class="screen">
        <brew-top-bar title="Saved Brews"></brew-top-bar>

        <div class="content">
          ${
            brews.length === 0
              ? html`<div class="empty-state"><brew-empty-state></brew-empty-state></div>`
              : brews.map((brew, index) => {
                  const colors = getAvatarColors(index);
                  return html`
                    <brew-list-row
                      headline="${brew.brewType} · ${brew.ratio}:1"
                      supporting="${brew.coffee}g coffee · ${brew.water}g water · ${brew.oz}oz"
                      leading-initial="${getInitial(brew.brewType)}"
                      leading-bg="${colors.background}"
                      leading-fg="${colors.foreground}"
                      href="/saved/${brew.id}"
                    ></brew-list-row>
                  `;
                })
          }
        </div>

        <brew-bottom-nav active="saved"></brew-bottom-nav>
      </div>
    `;
  }
}
