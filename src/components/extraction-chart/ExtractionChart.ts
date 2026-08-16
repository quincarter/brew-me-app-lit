import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { IExtractionGhostPoint } from "../../shared/interfaces/extraction-chart.interface";
import { monitorSamplesSignal, scaleSamplesSignal } from "../../shared/stores/telemetry.store";
import {
  buildExtractionChartPath,
  type IChartDomain,
  type IChartPoint,
} from "../../shared/utilities/extraction-chart-path.utility";
import { ExtractionChartStyles } from "./extraction-chart.styles";

const VIEW_BOX_WIDTH = 320;
const VIEW_BOX_HEIGHT = 110;
const PRESSURE_MAX_BAR = 10;
const FLOW_MAX_GRAMS_PER_SECOND = 6;
const MIN_WEIGHT_MAX_GRAMS = 20;

/** Extracts the metric's points from a ghost curve, dropping samples where that metric wasn't recorded. */
const ghostSeries = (
  ghostCurve: IExtractionGhostPoint[],
  metric: "pressureBar" | "flowRateGramsPerSecond" | "weightGrams",
): IChartPoint[] =>
  ghostCurve
    .filter((point) => point[metric] !== undefined)
    .map((point) => ({ elapsedSeconds: point.elapsedSeconds, value: point[metric] as number }));

/**
 * # Extraction Chart
 * The Timer screen's live pressure/flow/weight curve, plotted from
 * `scaleSamplesSignal`/`monitorSamplesSignal` directly (no props needed for
 * the live data). Shows a "Waiting for data…" placeholder until there are
 * ≥2 combined samples, and stays visible with the frozen final curve after
 * a mid-/post-session device disconnect (that visibility gating lives in
 * the Timer page, not here).
 * @element brew-extraction-chart
 */
export class ExtractionChart extends SignalWatcher(LitElement) {
  static styles = [ExtractionChartStyles];

  /** A previously-recorded shot's curve to overlay as a dashed comparison line - null (the default) renders nothing extra. Design/plumbing only until the Visualizer feature feeds this. */
  @property({ type: Array }) ghostCurve: IExtractionGhostPoint[] | null = null;
  @property({ type: String }) ghostLabel = "";

  render(): HTMLTemplateResult {
    const scaleSamples = scaleSamplesSignal.value;
    const monitorSamples = monitorSamplesSignal.value;

    if (scaleSamples.length + monitorSamples.length < 2) {
      return html`
        <div class="chart-card">
          <p class="placeholder">Waiting for data…</p>
        </div>
      `;
    }

    const startTimestampMs = Math.min(
      ...scaleSamples.map((sample) => sample.timestampMs),
      ...monitorSamples.map((sample) => sample.timestampMs),
    );
    const elapsedSecondsOf = (timestampMs: number): number =>
      (timestampMs - startTimestampMs) / 1000;
    const maxElapsedSeconds = Math.max(
      0,
      ...scaleSamples.map((sample) => elapsedSecondsOf(sample.timestampMs)),
      ...monitorSamples.map((sample) => elapsedSecondsOf(sample.timestampMs)),
    );

    const pressurePoints: IChartPoint[] = monitorSamples.map((sample) => ({
      elapsedSeconds: elapsedSecondsOf(sample.timestampMs),
      value: sample.reading.pressureBar,
    }));
    const flowPoints: IChartPoint[] = scaleSamples.map((sample) => ({
      elapsedSeconds: elapsedSecondsOf(sample.timestampMs),
      value: sample.reading.flowRateGramsPerSecond,
    }));
    const weightPoints: IChartPoint[] = scaleSamples.map((sample) => ({
      elapsedSeconds: elapsedSecondsOf(sample.timestampMs),
      value: sample.reading.weightGrams,
    }));
    const observedMaxWeight = Math.max(0, ...weightPoints.map((point) => point.value));

    const timeDomain = { minElapsedSeconds: 0, maxElapsedSeconds };
    const pressureDomain: IChartDomain = {
      ...timeDomain,
      minValue: 0,
      maxValue: PRESSURE_MAX_BAR,
    };
    const flowDomain: IChartDomain = {
      ...timeDomain,
      minValue: 0,
      maxValue: FLOW_MAX_GRAMS_PER_SECOND,
    };
    const weightDomain: IChartDomain = {
      ...timeDomain,
      minValue: 0,
      maxValue: Math.max(MIN_WEIGHT_MAX_GRAMS, observedMaxWeight),
    };

    const pressurePath = buildExtractionChartPath(
      pressurePoints,
      pressureDomain,
      VIEW_BOX_WIDTH,
      VIEW_BOX_HEIGHT,
    );
    const flowPath = buildExtractionChartPath(
      flowPoints,
      flowDomain,
      VIEW_BOX_WIDTH,
      VIEW_BOX_HEIGHT,
    );
    const weightPath = buildExtractionChartPath(
      weightPoints,
      weightDomain,
      VIEW_BOX_WIDTH,
      VIEW_BOX_HEIGHT,
    );

    const ghostCurve = this.ghostCurve;
    const showGhost = ghostCurve !== null && ghostCurve.length >= 2;
    let ghostPressurePath = "";
    let ghostFlowPath = "";
    let ghostWeightPath = "";
    if (showGhost && ghostCurve) {
      const ghostPressurePoints = ghostSeries(ghostCurve, "pressureBar");
      const ghostFlowPoints = ghostSeries(ghostCurve, "flowRateGramsPerSecond");
      const ghostWeightPoints = ghostSeries(ghostCurve, "weightGrams");
      const ghostElapsedSeconds = ghostCurve.map((point) => point.elapsedSeconds);
      const ghostTimeDomain = {
        minElapsedSeconds: Math.min(...ghostElapsedSeconds),
        maxElapsedSeconds: Math.max(...ghostElapsedSeconds),
      };
      const ghostObservedMaxWeight = Math.max(0, ...ghostWeightPoints.map((p) => p.value));

      ghostPressurePath = buildExtractionChartPath(
        ghostPressurePoints,
        { ...ghostTimeDomain, minValue: 0, maxValue: PRESSURE_MAX_BAR },
        VIEW_BOX_WIDTH,
        VIEW_BOX_HEIGHT,
      );
      ghostFlowPath = buildExtractionChartPath(
        ghostFlowPoints,
        { ...ghostTimeDomain, minValue: 0, maxValue: FLOW_MAX_GRAMS_PER_SECOND },
        VIEW_BOX_WIDTH,
        VIEW_BOX_HEIGHT,
      );
      ghostWeightPath = buildExtractionChartPath(
        ghostWeightPoints,
        {
          ...ghostTimeDomain,
          minValue: 0,
          maxValue: Math.max(MIN_WEIGHT_MAX_GRAMS, ghostObservedMaxWeight),
        },
        VIEW_BOX_WIDTH,
        VIEW_BOX_HEIGHT,
      );
    }

    return html`
      <div class="chart-card">
        <div class="legend">
          <span class="legend-chip pressure"><span class="legend-dot"></span>Pressure</span>
          <span class="legend-chip flow"><span class="legend-dot"></span>Flow</span>
          <span class="legend-chip weight"><span class="legend-dot"></span>Weight</span>
        </div>

        <svg
          class="chart-svg"
          viewBox="0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="${VIEW_BOX_HEIGHT - 10}"
            x2="${VIEW_BOX_WIDTH}"
            y2="${VIEW_BOX_HEIGHT - 10}"
            class="baseline"
          ></line>
          ${ghostPressurePath ? html`<path d="${ghostPressurePath}" class="ghost-path"></path>` : nothing}
          ${ghostFlowPath ? html`<path d="${ghostFlowPath}" class="ghost-path"></path>` : nothing}
          ${ghostWeightPath ? html`<path d="${ghostWeightPath}" class="ghost-path"></path>` : nothing}
          <path d="${pressurePath}" class="series-path pressure"></path>
          <path d="${flowPath}" class="series-path flow"></path>
          <path d="${weightPath}" class="series-path weight"></path>
        </svg>

        ${
          showGhost
            ? html`
                <div class="ghost-caption-row">
                  <span class="ghost-swatch"></span>
                  <span class="ghost-caption">Ghost: ${this.ghostLabel}</span>
                </div>
              `
            : nothing
        }
      </div>
    `;
  }
}
