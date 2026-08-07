export interface IAvatarColors {
  background: string;
  foreground: string;
}

/** Tonal container/on-container pairs cycled through for list avatars. */
const PALETTE: IAvatarColors[] = [
  {
    background: "var(--brew-color-primary-container)",
    foreground: "var(--brew-color-on-primary-container)",
  },
  {
    background: "var(--brew-color-secondary-container)",
    foreground: "var(--brew-color-on-secondary-container)",
  },
  {
    background: "var(--brew-color-tertiary-container)",
    foreground: "var(--brew-color-on-tertiary-container)",
  },
];

export const getAvatarColors = (index: number): IAvatarColors => PALETTE[index % PALETTE.length];

export const getInitial = (label: string): string => (label ? label.charAt(0).toUpperCase() : "?");
