import type { IBrewStep } from "../interfaces/brew.interface";

/** Only the fields that differ from the original row with the same `id` - `seconds: null` matches `IBrewStep`'s own "untimed point" meaning, while `value`/`note: null` is a diff-only sentinel for "cleared back to unset" (translated back to `undefined` by `applyBrewStepsDiff`, since `IBrewStep` has no real null variant for those two). */
export interface IBrewStepFieldChange {
  id: string;
  label?: string;
  kind?: "timed" | "note";
  seconds?: number | null;
  value?: string | null;
  note?: string | null;
}

/** Compact representation of how a modified `IBrewStep[]` differs from its original - what a `/share` link sends instead of the full modified array when a curated recipe's steps were hand-edited. */
export interface IBrewStepsDiff {
  /** Rows present in both arrays (matched by `id`), with only the fields that changed. */
  changed?: IBrewStepFieldChange[];
  /** Full row objects for `id`s that only exist in the modified array. */
  added?: IBrewStep[];
  /** `id`s that existed in the original but were removed. */
  removed?: string[];
  /** Full ordered `id` list for the modified array - included only when the order actually differs from "original order (minus removed) with added rows appended", i.e. only on an actual drag/keyboard reorder. */
  order?: string[];
}

const fieldsEqual = <T>(a: T | undefined, b: T | undefined): boolean => (a ?? null) === (b ?? null);

/**
 * Diffs a modified `IBrewStep[]` against its original, row-matched by `id`.
 * Row order, added rows, removed rows, and per-field edits are all captured
 * independently so a single-field tweak (e.g. one step's duration) doesn't
 * require re-sending every other untouched row.
 */
export const computeBrewStepsDiff = (
  original: IBrewStep[],
  modified: IBrewStep[],
): IBrewStepsDiff => {
  const originalById = new Map(original.map((step) => [step.id, step]));
  const modifiedIds = new Set(modified.map((step) => step.id));

  const changed: IBrewStepFieldChange[] = [];
  const added: IBrewStep[] = [];

  for (const step of modified) {
    const orig = originalById.get(step.id);
    if (!orig) {
      added.push(step);
      continue;
    }

    const change: IBrewStepFieldChange = { id: step.id };
    let hasChange = false;
    if (step.label !== orig.label) {
      change.label = step.label;
      hasChange = true;
    }
    if (step.kind !== orig.kind) {
      change.kind = step.kind;
      hasChange = true;
    }
    if (!fieldsEqual(step.seconds, orig.seconds)) {
      change.seconds = step.seconds ?? null;
      hasChange = true;
    }
    if (!fieldsEqual(step.value, orig.value)) {
      change.value = step.value ?? null;
      hasChange = true;
    }
    if (!fieldsEqual(step.note, orig.note)) {
      change.note = step.note ?? null;
      hasChange = true;
    }
    if (hasChange) changed.push(change);
  }

  const removed = original.filter((step) => !modifiedIds.has(step.id)).map((step) => step.id);

  const defaultOrder = [
    ...original.filter((step) => modifiedIds.has(step.id)).map((step) => step.id),
    ...added.map((step) => step.id),
  ];
  const actualOrder = modified.map((step) => step.id);
  const orderChanged = defaultOrder.join("|") !== actualOrder.join("|");

  const diff: IBrewStepsDiff = {};
  if (changed.length > 0) diff.changed = changed;
  if (added.length > 0) diff.added = added;
  if (removed.length > 0) diff.removed = removed;
  if (orderChanged) diff.order = actualOrder;
  return diff;
};

/** Inverse of `computeBrewStepsDiff` - reconstructs the modified array by applying a diff back onto the same original array it was computed against. */
export const applyBrewStepsDiff = (original: IBrewStep[], diff: IBrewStepsDiff): IBrewStep[] => {
  const removedIds = new Set(diff.removed ?? []);
  const changeById = new Map((diff.changed ?? []).map((change) => [change.id, change]));

  const patched = original
    .filter((step) => !removedIds.has(step.id))
    .map((step) => {
      const change = changeById.get(step.id);
      return change ? applyFieldChange(step, change) : step;
    });

  const withAdded = [...patched, ...(diff.added ?? [])];

  if (!diff.order) return withAdded;

  const byId = new Map(withAdded.map((step) => [step.id, step]));
  return diff.order
    .map((id) => byId.get(id))
    .filter((step): step is IBrewStep => step !== undefined);
};

const applyFieldChange = (step: IBrewStep, change: IBrewStepFieldChange): IBrewStep => {
  const result: IBrewStep = { ...step };
  if (change.label !== undefined) result.label = change.label;
  if (change.kind !== undefined) result.kind = change.kind;
  if (change.seconds !== undefined) result.seconds = change.seconds;
  if (change.value !== undefined) result.value = change.value === null ? undefined : change.value;
  if (change.note !== undefined) result.note = change.note === null ? undefined : change.note;
  return result;
};
