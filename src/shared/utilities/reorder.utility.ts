/**
 * Moves the item at `fromIndex` to `toIndex`, returning a new array (the
 * input is never mutated) - shared by `brew-steps-card`'s drag-to-reorder
 * and its arrow-key equivalent, both of which just need "put this row
 * somewhere else in the list" without caring how the new position was
 * determined (pointer position vs. an arrow key).
 */
export const moveItem = <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length
  ) {
    return [...items];
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved as T);
  return next;
};
