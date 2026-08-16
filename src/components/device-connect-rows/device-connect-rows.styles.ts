import { css } from "lit";

export const DeviceConnectRowsStyles = css`
  :host {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
  }

  .row-label {
    font-size: 16px;
    color: var(--brew-color-on-surface);
  }

  .device-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;
