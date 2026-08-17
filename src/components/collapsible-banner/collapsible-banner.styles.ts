import { css } from "lit";

export const CollapsibleBannerStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  .row {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transform: translateY(-4px);
    transition:
      grid-template-rows 0.22s ease,
      opacity 0.18s ease,
      transform 0.22s ease;
  }

  :host([open]) .row {
    grid-template-rows: 1fr;
    opacity: 1;
    transform: translateY(0);
  }

  .inner {
    overflow: hidden;
    min-height: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .row {
      transition: none;
    }
  }
`;
