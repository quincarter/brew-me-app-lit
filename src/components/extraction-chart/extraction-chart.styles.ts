import { css } from "lit";

export const ExtractionChartStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  .chart-card {
    width: 100%;
    box-sizing: border-box;
    background: var(--brew-color-surface-container-low);
    border-radius: 16px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .placeholder {
    margin: 0;
    padding: 24px 0;
    text-align: center;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .legend-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 8px;
    border-radius: 11px;
    font-size: 10px;
    font-weight: 600;
  }

  .legend-chip.pressure {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
  }

  .legend-chip.flow {
    background: var(--brew-color-tertiary-container);
    color: var(--brew-color-on-tertiary-container);
  }

  .legend-chip.weight {
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
  }

  .legend-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  .chart-svg {
    width: 100%;
    height: 110px;
    display: block;
  }

  .baseline {
    stroke: var(--brew-color-outline-variant);
    stroke-width: 1;
  }

  .series-path {
    fill: none;
    stroke-width: 2;
  }

  .series-path.pressure {
    stroke: var(--brew-color-secondary);
  }

  .series-path.flow {
    stroke: var(--brew-color-tertiary);
  }

  .series-path.weight {
    stroke: var(--brew-color-primary);
  }

  .ghost-path {
    fill: none;
    stroke: var(--brew-color-primary);
    stroke-width: 2;
    stroke-dasharray: 4 4;
    opacity: 0.55;
  }

  .ghost-caption-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ghost-swatch {
    width: 14px;
    height: 0;
    display: inline-block;
    border-top: 2px dashed var(--brew-color-primary);
    opacity: 0.55;
  }

  .ghost-caption {
    font-size: 10px;
    color: var(--brew-color-on-surface-variant);
  }
`;
