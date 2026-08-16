import { css } from "lit";

export const DeviceConnectSheetStyles = css`
  :host {
    display: contents;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  .header-title {
    font-size: 20px;
    font-weight: 500;
    color: var(--brew-color-on-surface);
  }

  .header-hint {
    margin: 0;
    font-size: 13px;
    color: var(--brew-color-on-surface-variant);
    line-height: 1.5;
  }
`;
