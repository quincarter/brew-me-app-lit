import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing, type PropertyValues } from "lit";
import { state } from "lit/decorators.js";
import type { ITourStep } from "../../shared/interfaces/tour.interface";
import {
  activeTourStepsSignal,
  advanceTour,
  currentTourStepSignal,
  isFirstTourStepSignal,
  retreatTour,
  skipTour,
  tourActiveSignal,
  tourStepIndexSignal,
} from "../../shared/stores/tour.store";
import { awaitTourTarget } from "../../shared/utilities/tour-target.utility";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import { TourOverlayStyles } from "./tour-overlay.styles";

/**
 * # Tour Overlay
 * A full-viewport, look-only walkthrough overlay driven entirely by
 * `tour.store.ts`. Each `ITourStep` renders one of two layouts:
 * - `"slide"` (and any `"spotlight"` step whose target couldn't be found in
 *   time): a centered card, same visual family as `brew-install-prompt`.
 * - `"spotlight"`: a scrim with a cutout punched around a real on-screen
 *   element (found via `awaitTourTarget`) plus a card anchored near it.
 * @element brew-tour-overlay
 */
export class TourOverlay extends SignalWatcher(LitElement) {
  static styles = [TourOverlayStyles];

  @state() private _targetRect: DOMRect | null = null;
  @state() private _targetLost = false;

  /** Which step's target/route activation has already run, so `willUpdate` only re-triggers on a real step change. */
  private _activeStepId: string | null = null;
  private _targetElement: HTMLElement | null = null;
  /** Bumped at the start of every `_activateStep` call so a stale async resolution from a superseded step can't clobber newer state. */
  private _activationToken = 0;

  private _onResize = (): void => {
    if (!this._targetElement) return;
    this._targetRect = this._targetElement.getBoundingClientRect();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", this._onResize);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._onResize);
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    const step = currentTourStepSignal.value;
    const stepId = step?.id ?? null;
    if (stepId !== this._activeStepId) {
      this._activeStepId = stepId;
      if (step) void this._activateStep(step);
    }
  }

  private async _activateStep(step: ITourStep): Promise<void> {
    this._activationToken += 1;
    const token = this._activationToken;

    this._targetRect = null;
    this._targetLost = false;
    this._targetElement = null;

    if (step.kind !== "spotlight" || !step.targetSelectors) return;

    const target = await awaitTourTarget(step.targetSelectors);
    if (token !== this._activationToken) return;

    if (!target) {
      this._targetLost = true;
      return;
    }

    this._targetElement = target;
    this._targetRect = target.getBoundingClientRect();
  }

  private _renderControls(step: ITourStep): HTMLTemplateResult {
    const steps = activeTourStepsSignal.value;
    return html`
      <div class="controls">
        <div class="progress">
          ${steps.map(
            (_step, index) => html`
              <span class="dot ${index === tourStepIndexSignal.value ? "active" : ""}"></span>
            `,
          )}
        </div>
        <div class="buttons">
          ${
            isFirstTourStepSignal.value
              ? nothing
              : html`<brew-button variant="text" @button-click="${retreatTour}">Back</brew-button>`
          }
          <brew-button variant="filled" @button-click="${advanceTour}"
            >${step.ctaLabel}</brew-button
          >
        </div>
      </div>
    `;
  }

  private _renderSlide(step: ITourStep): HTMLTemplateResult {
    return html`
      <div class="scrim bottom-anchored">
        <div class="card bottom-card" role="dialog" aria-label="${step.title}">
          <brew-icon-button
            class="close"
            icon="close"
            aria-label="Skip tour"
            @icon-click="${skipTour}"
          ></brew-icon-button>
          <h2 class="title">${step.title}</h2>
          <p class="body">${step.body}</p>
          ${this._renderControls(step)}
        </div>
      </div>
    `;
  }

  private _renderSpotlight(step: ITourStep, rect: DOMRect): HTMLTemplateResult {
    const padding = step.spotlightPadding ?? 8;
    const cutoutTop = Math.max(0, rect.top - padding);
    const cutoutLeft = Math.max(0, rect.left - padding);
    const cutoutWidth = rect.width + padding * 2;
    const cutoutHeight = rect.height + padding * 2;

    const cutoutStyle = `top: ${cutoutTop}px; left: ${cutoutLeft}px; width: ${cutoutWidth}px; height: ${cutoutHeight}px;`;

    const cardWidth = 320;
    const targetCenterX = rect.left + rect.width / 2;
    const clampedLeft = Math.max(
      16,
      Math.min(targetCenterX - cardWidth / 2, window.innerWidth - cardWidth - 16),
    );

    const spaceBelow = window.innerHeight - (rect.bottom + padding);
    const spaceAbove = rect.top - padding;

    const placeBelow = spaceBelow >= 180 || spaceBelow > spaceAbove;
    const cardStyle = placeBelow
      ? `top: ${Math.min(rect.bottom + padding + 12, window.innerHeight - 200)}px; left: ${clampedLeft}px;`
      : `bottom: ${Math.min(window.innerHeight - (rect.top - padding) + 12, window.innerHeight - 200)}px; left: ${clampedLeft}px;`;

    return html`
      <div class="scrim">
        <div class="cutout" style="${cutoutStyle}"></div>
        <div
          class="card spotlight-card"
          style="${cardStyle}"
          role="dialog"
          aria-label="${step.title}"
        >
          <brew-icon-button
            class="close"
            icon="close"
            aria-label="Skip tour"
            @icon-click="${skipTour}"
          ></brew-icon-button>
          <h2 class="title">${step.title}</h2>
          <p class="body">${step.body}</p>
          ${this._renderControls(step)}
        </div>
      </div>
    `;
  }

  render(): HTMLTemplateResult {
    if (!tourActiveSignal.value) return html``;

    const step = currentTourStepSignal.value;
    if (!step) return html``;

    if (step.kind === "spotlight" && this._targetRect && !this._targetLost) {
      return this._renderSpotlight(step, this._targetRect);
    }

    return this._renderSlide(step);
  }
}
