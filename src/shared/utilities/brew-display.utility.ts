import type { IShareableBrew } from "../interfaces/brew.interface";

/** The user-facing label for a brew: its free-form name if set, else its brew type category. */
export const getBrewDisplayName = (brew: IShareableBrew): string =>
  brew.name?.trim() || brew.brewType;
