import type { IBrewStep } from "../interfaces/brew.interface";
import type { IBrewStepProgress } from "../interfaces/timer.interface";

/**
 * Maps a brew's step sequence to each timed step's live status against the
 * timer's elapsed seconds - "done", "active", or "upcoming" - by walking the
 * timed steps in order and accumulating their durations. A timed step with
 * no duration (e.g. "Draw down") never itself elapses, so once its start is
 * reached it stays "active" until a later timed step's start is reached. If
 * several zero/null-duration timed steps sit back to back (sharing the same
 * start offset), the *last* one in the tied group is "active" once that
 * offset is reached, and the earlier ones in the group go straight from
 * "upcoming" to "done" - each took no time of its own, so it's already
 * superseded the instant a later step at the same offset is reached.
 * "note" rows (e.g. "Filter" -> "Paper") don't participate in timing at all
 * and are always reported "upcoming".
 */
export const getBrewStepProgress = (
  steps: IBrewStep[],
  elapsedSeconds: number,
): IBrewStepProgress[] => {
  let activeIndex = -1;
  let cursor = 0;
  steps.forEach((step, index) => {
    if (step.kind !== "timed") return;
    if (elapsedSeconds >= cursor) activeIndex = index;
    if (typeof step.seconds === "number" && step.seconds > 0) cursor += step.seconds;
  });

  cursor = 0;
  return steps.map((step, index) => {
    const startSeconds = cursor;
    if (step.kind === "timed" && typeof step.seconds === "number" && step.seconds > 0) {
      cursor += step.seconds;
    }

    if (step.kind !== "timed" || activeIndex === -1) {
      return { step, status: "upcoming", startSeconds };
    }
    if (index < activeIndex) return { step, status: "done", startSeconds };
    if (index === activeIndex) return { step, status: "active", startSeconds };
    return { step, status: "upcoming", startSeconds };
  });
};
