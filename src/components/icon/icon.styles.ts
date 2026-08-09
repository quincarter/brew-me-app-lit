import { css } from "lit";

export const IconStyles = css`
  :host {
    display: inline-flex;
    color: inherit;
  }

  .icon-svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon-svg svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .material-symbols-outlined {
    font-family: "Material Symbols Outlined";
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "liga";
    color: inherit;
  }
`;
