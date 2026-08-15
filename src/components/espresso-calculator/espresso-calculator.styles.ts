import { css } from "lit";

export const EspressoCalculatorStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .dial-in-card {
    background: var(--brew-color-surface-container-low);
    border: 1px solid var(--brew-color-outline-variant);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dial-in-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--brew-color-on-surface-variant);
  }

  .dial-in-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--brew-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dial-in-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--brew-color-on-surface);
  }

  .dial-in-list li::marker {
    color: var(--brew-color-primary);
  }

  .dial-in-list strong {
    color: var(--brew-color-on-surface);
  }
`;
