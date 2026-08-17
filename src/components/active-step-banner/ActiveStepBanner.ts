import { type HTMLTemplateResult, html, LitElement, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import type { IBrewStep } from "../../shared/interfaces/brew.interface";
import { getBrewStepProgress } from "../../shared/utilities/brew-step-progress.utility";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import { ActiveStepBannerStyles } from "./active-step-banner.styles";

interface IActiveStepCue {
  id: string;
  label: string;
  kind: "timed" | "note";
  value?: string;
  /** Non-null only for a "timed" step still counting down - a "note" step (or a "timed" step with no duration) has no ticking number. */
  remainingSeconds: number | null;
  nextLabel: string | null;
}

interface IAllCompleteCue {
  id: "__all-complete__";
  allComplete: true;
}

type ActiveStepCue = IActiveStepCue | IAllCompleteCue;

/**
 * # Active Step Banner
 * A large, `position: sticky`-pinned banner for the Timer screen's guided-
 * brew flow: always shows the current brew step and, for a "timed" step, a
 * big tabular-nums countdown (an untimed "note" step just shows its value,
 * with no ticking number). A fixed-height "Up next" line sits underneath -
 * reserved at all times via `visibility`/`opacity` rather than conditional
 * rendering, so the banner's own height never changes as seconds tick or as
 * the next step appears/disappears, and nothing below it ever shifts.
 *
 * Mirrors the current/next-step derivation `brew-steps-card`'s private
 * `_renderCondensedCue` already does over the same `getBrewStepProgress`
 * result, intentionally duplicated rather than shared - that method always
 * renders that card's compact read-only row, while this component is a much
 * bigger, independently animated, always-visible treatment of the same
 * "what's happening right now" data, placed at the top of the Timer
 * screen's scroll area rather than inside the (possibly scrolled-past)
 * Brew Steps card further down.
 *
 * Not gated on any BLE device being connected - it reflects the guided
 * timer's own progress through `steps`, independent of live scale/monitor
 * telemetry.
 * @element brew-active-step-banner
 */
export class ActiveStepBanner extends LitElement {
  static styles = [ActiveStepBannerStyles];

  @property({ type: Array }) steps: IBrewStep[] | null = null;
  @property({ type: Number, attribute: "elapsed-seconds" }) elapsedSeconds = 0;

  @state() private _cue: ActiveStepCue | null = null;

  private _lastCueId: string | null = null;
  private _stepChanged = false;

  private _computeCue(): ActiveStepCue | null {
    const steps = this.steps;
    if (!steps || steps.length === 0) return null;

    // Checked before consulting `getBrewStepProgress` below: its `activeIndex`
    // is never -1 once elapsed time has reached any timed step's start (the
    // first one starts at 0), so once time runs past every timed step's
    // total it just keeps reporting the *last* timed step "active" forever
    // rather than ever going "all done" - this banner needs that state
    // itself instead, to swap to the "All steps complete" cue.
    //
    // Only applies when the sequence actually *ends* on a fixed-duration
    // timed step - a trailing "note" row, or a "timed" row with no set
    // duration (e.g. an open-ended "Draw down"/"Plunge"), is meant to stay
    // the current step indefinitely once reached, with no time-based
    // completion signal, so those never trigger this.
    const lastStep = steps[steps.length - 1];
    const endsOnFixedDurationStep =
      lastStep.kind === "timed" && typeof lastStep.seconds === "number" && lastStep.seconds > 0;
    const totalTimedSeconds = steps
      .filter(
        (step): step is IBrewStep & { seconds: number } =>
          step.kind === "timed" && typeof step.seconds === "number",
      )
      .reduce((sum, step) => sum + step.seconds, 0);

    if (endsOnFixedDurationStep && this.elapsedSeconds >= totalTimedSeconds) {
      return { id: "__all-complete__", allComplete: true };
    }

    const progress = getBrewStepProgress(steps, this.elapsedSeconds);
    const activeIndex = progress.findIndex((row) => row.status === "active");

    if (activeIndex !== -1) {
      const activeRow = progress[activeIndex];
      const step = activeRow.step;
      const remainingSeconds =
        step.kind === "timed" && typeof step.seconds === "number"
          ? Math.max(0, step.seconds - (this.elapsedSeconds - activeRow.startSeconds))
          : null;
      const nextStep = activeIndex + 1 < steps.length ? steps[activeIndex + 1] : null;

      // A trailing "note" row right after the sequence's last timed step
      // (e.g. "Dilute & serve") can never become `getBrewStepProgress`'s own
      // "active" row itself - only "timed" rows ever do - so once this timed
      // step's own countdown has run out, hand the cue to that note step
      // instead of freezing here at 00:00 for the rest of the brew.
      if (remainingSeconds === 0 && nextStep?.kind === "note") {
        const afterNext = activeIndex + 2 < steps.length ? steps[activeIndex + 2] : null;
        return {
          id: nextStep.id,
          label: nextStep.label,
          kind: nextStep.kind,
          value: nextStep.value,
          remainingSeconds: null,
          nextLabel: afterNext ? afterNext.label : null,
        };
      }

      return {
        id: step.id,
        label: step.label,
        kind: step.kind,
        value: step.value,
        remainingSeconds,
        nextLabel: nextStep ? nextStep.label : null,
      };
    }

    // No "timed" row is active - `steps` is all "note" rows with nothing to
    // time at all, so there's no elapsed-time-driven progression: show the
    // sequence's first row, same fallback `BrewStepsCard._renderCondensedCue`
    // uses for this case.
    const first = steps[0];
    const next = steps.length > 1 ? steps[1] : null;
    return {
      id: first.id,
      label: first.label,
      kind: first.kind,
      value: first.value,
      remainingSeconds: null,
      nextLabel: next ? next.label : null,
    };
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (!changed.has("steps") && !changed.has("elapsedSeconds")) return;

    const cue = this._computeCue();
    this._cue = cue;
    const currentId = cue?.id ?? null;
    this._stepChanged =
      this._lastCueId !== null && currentId !== null && this._lastCueId !== currentId;
    this._lastCueId = currentId;
  }

  /**
   * Restarts whichever CSS keyframe animation the stylesheet already
   * assigns `selector`'s element (the tick-pulse on `.countdown`, the
   * step-change fade on `.main-row`) by clearing it to `"none"`, forcing a
   * reflow, then clearing the inline override back to `""` so the
   * stylesheet's own `animation` declaration - `none` under
   * `prefers-reduced-motion: reduce`, the real keyframe otherwise - takes
   * over again from the start.
   */
  private _restartAnimation(selector: string): void {
    const el = this.shadowRoot?.querySelector<HTMLElement>(selector);
    if (!el) return;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has("elapsedSeconds")) {
      this._restartAnimation(".countdown");
    }
    if (this._stepChanged) {
      this._restartAnimation(".main-row");
      this._stepChanged = false;
    }
  }

  render(): HTMLTemplateResult | typeof nothing {
    const cue = this._cue;
    if (!cue) return nothing;

    if ("allComplete" in cue) {
      return html`
        <div class="banner">
          <div class="main-row">
            <div class="label-group">
              <span class="eyebrow">Current step</span>
              <span class="label" aria-live="polite">All steps complete</span>
            </div>
          </div>
          <div class="next-row next-row-empty">
            <span class="next-tag">Up next</span>
            <span class="next-label"></span>
          </div>
        </div>
      `;
    }

    const hasNext = cue.nextLabel !== null;

    return html`
      <div class="banner">
        <div class="main-row">
          <div class="label-group">
            <span class="eyebrow">Current step</span>
            <span class="label" aria-live="polite">${cue.label}</span>
          </div>
          ${
            cue.kind === "timed"
              ? cue.remainingSeconds !== null
                ? html`<span class="countdown">${formatSeconds(cue.remainingSeconds)}</span>`
                : html`<span class="value-badge">Now</span>`
              : cue.value
                ? html`<span class="value-badge">${cue.value}</span>`
                : nothing
          }
        </div>
        <div class="next-row ${hasNext ? "" : "next-row-empty"}">
          <span class="next-tag">Up next</span>
          <span class="next-label">${cue.nextLabel ?? ""}</span>
        </div>
      </div>
    `;
  }
}
