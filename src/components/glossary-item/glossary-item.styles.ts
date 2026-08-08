import { css } from "lit";

export const GlossaryItemStyles = css`
  :host {
    display: block;
  }

  .card {
    background: var(--brew-color-surface-container);
    border-radius: 16px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .term {
    font-size: 14px;
    font-weight: 600;
    color: var(--brew-color-on-surface);
  }

  .definition {
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    line-height: 1.5;
  }
`;
