import { css } from "lit";

export const ActiveStepBannerStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  .banner {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
    padding: 16px 20px;
    border-radius: 20px;
    background: var(--brew-color-primary-container);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    animation: stepFadeIn 380ms cubic-bezier(0.2, 0, 0, 1) both;
  }

  @keyframes stepFadeIn {
    0% {
      opacity: 0;
      transform: translateY(6px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .label-group {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--brew-color-on-primary-container);
    opacity: 0.75;
  }

  .label {
    font-size: 30px;
    font-weight: 700;
    line-height: 1.15;
    color: var(--brew-color-on-primary-container);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* A narrower step than the app's 840px rail breakpoint (responsive.styles.ts)
   * on purpose - this only bumps type scale for larger phones, not the
   * phone/rail layout switch, so most phones (not just tablet+) get it. */
  @media (min-width: 480px) {
    .label {
      font-size: 38px;
    }
  }

  /* tabular-nums keeps every digit the same width, so a countdown moving
   * from e.g. "0:09" to "0:10" never shifts the layout beside it. */
  .countdown {
    flex-shrink: 0;
    font-size: 44px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--brew-color-on-primary-container);
    animation: tickPulse 550ms ease-out;
  }

  @media (min-width: 480px) {
    .countdown {
      font-size: 56px;
    }
  }

  @keyframes tickPulse {
    0% {
      opacity: 0.5;
      transform: scale(0.94);
    }
    45% {
      opacity: 1;
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .value-badge {
    flex-shrink: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--brew-color-on-primary-container);
  }

  /* Reserved at all times (never conditionally rendered) so nothing below
   * the banner shifts as a next step appears/disappears - only opacity and
   * visibility toggle, height never changes. */
  .next-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 22px;
    opacity: 1;
    visibility: visible;
    transition: opacity 150ms ease;
  }

  .next-row-empty {
    opacity: 0;
    visibility: hidden;
  }

  .next-tag {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brew-color-on-primary-container);
    opacity: 0.7;
  }

  .next-label {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--brew-color-on-primary-container);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .main-row,
    .countdown {
      animation: none;
    }
  }
`;
