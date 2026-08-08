import { css } from "lit";

export const LinkCardStyles = css`
  :host {
    display: block;
  }

  .link-card {
    background: var(--brew-color-secondary-container);
    color: var(--brew-color-on-secondary-container);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    cursor: pointer;
    box-sizing: border-box;
  }

  .link-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--brew-color-surface-container-lowest);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--brew-color-secondary);
  }

  .link-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .link-title {
    font-size: 15px;
    font-weight: 500;
  }

  .link-subtitle {
    font-size: 12px;
  }
`;
