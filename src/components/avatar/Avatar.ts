import { type HTMLTemplateResult, html, LitElement, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { AvatarStyles } from "./avatar.styles";

/**
 * # Avatar
 * A small circular avatar showing a method-specific icon when one is known,
 * falling back to a single initial on a tonal background otherwise.
 * @element brew-avatar
 */
export class Avatar extends LitElement {
  static styles = [AvatarStyles];

  @property({ type: String }) initial = "?";
  @property({ type: String }) background = "var(--brew-color-primary-container)";
  @property({ type: String }) foreground = "var(--brew-color-on-primary-container)";
  @property({ type: Number }) size = 40;
  @property({ type: Object }) icon: SVGTemplateResult | null = null;

  render(): HTMLTemplateResult {
    const fontSize = Math.round(this.size * 0.4);
    return html`
      <span
        class="avatar"
        style="width:${this.size}px;height:${this.size}px;background:${this.background};color:${this.foreground};font-size:${fontSize}px"
        >${this.icon ?? this.initial}</span
      >
    `;
  }
}
