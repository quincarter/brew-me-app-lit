import { css } from "lit";

export const ConnectionStatusPillStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 10px;
    border-radius: 12px;
    background: var(--brew-color-surface-container-high);
    color: var(--brew-color-on-surface-variant);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.5;
  }

  .label {
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  :host([state="connecting"]) {
    background: var(--brew-color-primary-container);
    color: var(--brew-color-on-primary-container);
  }

  :host([state="connecting"]) .dot {
    opacity: 1;
    animation: connection-status-pill-pulse 1.4s ease-in-out infinite;
  }

  :host([state="connected"]) {
    background: var(--brew-color-tertiary-container);
    color: var(--brew-color-on-tertiary-container);
  }

  :host([state="connected"]) .dot {
    opacity: 1;
  }

  @keyframes connection-status-pill-pulse {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 1;
    }
  }
`;
