const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (timestamp: number): number => new Date(timestamp).setHours(0, 0, 0, 0);

/**
 * A short, human-friendly relative day label for a timestamp: "Today",
 * "Yesterday", "{n} days ago" out to a week back, then a short date (e.g.
 * "Aug 5") beyond that. Compares local-midnight day boundaries - mirroring
 * `brew.store.ts`'s `dayKey`/`streakDaysSignal` - rather than a raw 24h
 * subtraction, so "11pm yesterday" reads as "Yesterday" instead of "0 days
 * ago".
 */
export const formatRelativeDay = (timestamp: number): string => {
  const dayDiff = Math.round((startOfDay(Date.now()) - startOfDay(timestamp)) / DAY_MS);

  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff <= 7) return `${dayDiff} days ago`;

  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
