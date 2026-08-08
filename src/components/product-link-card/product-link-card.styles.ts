import { css } from "lit";

export const ProductLinkCardStyles = css`
  :host {
    display: block;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .product-link-card {
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

  .product-icon {
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

  .product-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .product-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .product-title {
    font-size: 15px;
    font-weight: 500;
  }

  .affiliate-badge {
    display: inline-flex;
    align-items: center;
    height: 18px;
    padding: 0 7px;
    border-radius: 9px;
    background: var(--brew-color-surface-container-lowest);
    color: var(--brew-color-on-surface-variant);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    width: min-content;
  }

  .product-subtitle {
    font-size: 12px;
  }
`;
