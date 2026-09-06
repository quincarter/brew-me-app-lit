import { css } from "lit";

export const OauthCallbackPageStyles = css`
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
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 20px;
    text-align: center;
  }

  .message {
    font-size: 16px;
    color: var(--brew-color-on-surface-variant);
  }

  .message.error {
    color: var(--brew-color-error);
  }
`;
