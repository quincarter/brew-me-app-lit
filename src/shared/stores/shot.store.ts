import type { IBrewShot } from "../interfaces/shot.interface";
import { persistentSignal } from "./persistent-signal";

/** No seed data - a fresh install starts with nothing recorded. */
export const savedShotsSignal = persistentSignal<IBrewShot[]>([], { key: "saved-shots" });

export const addShot = (shot: Omit<IBrewShot, "id" | "createdAt">): IBrewShot => {
  const now = Date.now();
  const savedShot = { ...shot, id: now, createdAt: now };
  savedShotsSignal.value = [...savedShotsSignal.value, savedShot];
  return savedShot;
};

export const getShotsForBrew = (savedBrewId: number): IBrewShot[] =>
  savedShotsSignal.value.filter((shot) => shot.savedBrewId === savedBrewId);
