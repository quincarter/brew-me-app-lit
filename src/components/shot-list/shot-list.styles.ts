import { css } from "lit";

export const ShotListStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .shot-card {
    box-sizing: border-box;
    width: 100%;
    background: var(--brew-color-surface-container-low);
    border-radius: 16px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .shot-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .shot-date {
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .shot-elapsed {
    font-size: 12px;
    color: var(--brew-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }

  .shot-chart-svg {
    width: 100%;
    height: 64px;
    display: block;
  }

  .shot-baseline {
    stroke: var(--brew-color-outline-variant);
    stroke-width: 1;
  }

  .shot-series-path {
    fill: none;
    stroke-width: 1.5;
  }

  .shot-series-path.pressure {
    stroke: var(--brew-color-secondary);
  }

  .shot-series-path.flow {
    stroke: var(--brew-color-tertiary);
  }

  .shot-series-path.weight {
    stroke: var(--brew-color-primary);
  }
`;
