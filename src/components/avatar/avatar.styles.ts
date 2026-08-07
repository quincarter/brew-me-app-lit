import { css } from "lit";

export const AvatarStyles = css`
  :host {
    display: inline-flex;
    flex-shrink: 0;
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: 600;
    font-family: inherit;
  }
`;
