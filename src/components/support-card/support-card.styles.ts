import { css } from "lit";

export const SupportCardStyles = css`
  :host {
    display: block;
  }

  .support-card {
    box-sizing: border-box;
    padding: 20px;
    border-radius: 20px;
    background: var(--brew-color-tertiary-container);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }

  .support-message {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--brew-color-on-tertiary-container);
    max-width: 420px;
  }

  .bmc-link {
    display: inline-flex;
    line-height: 0;
    border-radius: 8px;
  }

  .bmc-image {
    width: 217px;
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    display: block;
  }
`;
