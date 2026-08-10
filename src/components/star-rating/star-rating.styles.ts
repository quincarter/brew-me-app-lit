import { css } from "lit";

export const StarRatingStyles = css`
  :host {
    display: inline-flex;
  }

  .stars {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .star {
    display: inline-flex;
    color: var(--brew-color-on-surface-variant);
  }

  .star.filled {
    color: var(--brew-color-primary);
  }

  button.star {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 6px;
    cursor: pointer;
    color: var(--brew-color-on-surface-variant);
  }

  button.star.filled {
    color: var(--brew-color-primary);
  }

  button.star:focus-visible {
    outline: 2px solid var(--brew-color-primary);
    outline-offset: 2px;
  }
`;
