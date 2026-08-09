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

  /* Icon SVGs ship with hardcoded width="34" height="34" attributes - scale
   * them to the avatar's own size instead. CSS wins over SVG presentation
   * attributes, so this overrides them regardless of the avatar's "size". */
  .avatar svg {
    width: 60%;
    height: 60%;
  }
`;
