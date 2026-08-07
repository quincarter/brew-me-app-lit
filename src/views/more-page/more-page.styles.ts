import { css } from "lit";

export const MorePageStyles = css`
  :host {
    display: block;
    height: 100%;
  }

  .screen {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content {
    padding: 4px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .stats {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .divider {
    height: 1px;
    background: var(--brew-color-outline-variant);
    margin: 8px 0;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
`;
