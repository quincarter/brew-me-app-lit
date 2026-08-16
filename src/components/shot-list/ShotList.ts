import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import "../empty-state/brew-empty-state";
import type { IBrewShot } from "../../shared/interfaces/shot.interface";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import { buildExtractionChartPath } from "../../shared/utilities/extraction-chart-path.utility";
import { buildExtractionSeries } from "../../shared/utilities/extraction-chart-series.utility";
import { ShotListStyles } from "./shot-list.styles";

const VIEW_BOX_WIDTH = 320;
const VIEW_BOX_HEIGHT = 64;
/** Same "nothing meaningful to draw" threshold ExtractionChart uses for the live chart. */
const MIN_SAMPLES_TO_CHART = 2;

/**
 * Builds the (pressure, flow, weight) static replay path `d` strings for one
 * shot's recorded telemetry, via the same series/domain shaping the live
 * `ExtractionChart` uses (`buildExtractionSeries`) - just fed a shot's own
 * sealed sample arrays instead of the live telemetry signals.
 */
const buildShotChartPaths = (
  shot: IBrewShot,
): { pressurePath: string; flowPath: string; weightPath: string } => {
  const { pressurePoints, pressureDomain, flowPoints, flowDomain, weightPoints, weightDomain } =
    buildExtractionSeries(shot.scaleSamples, shot.monitorSamples);

  return {
    pressurePath: buildExtractionChartPath(
      pressurePoints,
      pressureDomain,
      VIEW_BOX_WIDTH,
      VIEW_BOX_HEIGHT,
    ),
    flowPath: buildExtractionChartPath(flowPoints, flowDomain, VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT),
    weightPath: buildExtractionChartPath(
      weightPoints,
      weightDomain,
      VIEW_BOX_WIDTH,
      VIEW_BOX_HEIGHT,
    ),
  };
};

const renderShot = (shot: IBrewShot): HTMLTemplateResult => {
  const sampleCount = shot.scaleSamples.length + shot.monitorSamples.length;
  const hasChart = sampleCount >= MIN_SAMPLES_TO_CHART;
  const { pressurePath, flowPath, weightPath } = hasChart
    ? buildShotChartPaths(shot)
    : { pressurePath: "", flowPath: "", weightPath: "" };

  return html`
    <div class="shot-card">
      <div class="shot-meta">
        <span class="shot-date">${new Date(shot.createdAt).toLocaleDateString()}</span>
        <span class="shot-elapsed">${formatSeconds(shot.elapsedSeconds)}</span>
      </div>
      ${
        hasChart
          ? html`
              <svg
                class="shot-chart-svg"
                viewBox="0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="${VIEW_BOX_HEIGHT - 6}"
                  x2="${VIEW_BOX_WIDTH}"
                  y2="${VIEW_BOX_HEIGHT - 6}"
                  class="shot-baseline"
                ></line>
                <path d="${pressurePath}" class="shot-series-path pressure"></path>
                <path d="${flowPath}" class="shot-series-path flow"></path>
                <path d="${weightPath}" class="shot-series-path weight"></path>
              </svg>
            `
          : nothing
      }
    </div>
  `;
};

/**
 * # Shot List
 * A saved brew's recorded shots (from Timer's Stop/Seal), newest first -
 * each a compact card with the recorded date, elapsed time, and (when the
 * shot has >= 2 combined telemetry samples) a small static replay of its
 * pressure/flow/weight curve, color-coded to match `brew-extraction-chart`.
 * Renders `brew-empty-state` when there are no shots yet.
 * @element brew-shot-list
 */
export class ShotList extends LitElement {
  static styles = [ShotListStyles];

  @property({ type: Array }) shots: IBrewShot[] = [];

  render(): HTMLTemplateResult {
    if (this.shots.length === 0) {
      return html`
        <brew-empty-state
          message="No shots recorded yet — connect a device on the Timer screen and use Stop/Seal while brewing this ratio to save one here."
          cta-label="Go to Timer"
          cta-href="/timer"
        ></brew-empty-state>
      `;
    }

    const sortedShots = [...this.shots].sort((a, b) => b.createdAt - a.createdAt);

    return html` <div class="list">${sortedShots.map((shot) => renderShot(shot))}</div> `;
  }
}
