import { signal } from "@lit-labs/preact-signals";

/**
 * Module-level (not component-level) timer state, so the pour-over countdown
 * keeps running even if the user navigates away from the Timer screen and
 * back.
 */
export const timerSecondsSignal = signal(0);
export const timerRunningSignal = signal(false);

let intervalHandle: ReturnType<typeof setInterval> | undefined;

export const toggleTimer = (): void => {
  if (timerRunningSignal.value) {
    clearInterval(intervalHandle);
    timerRunningSignal.value = false;
    return;
  }

  intervalHandle = setInterval(() => {
    timerSecondsSignal.value += 1;
  }, 1000);
  timerRunningSignal.value = true;
};

export const resetTimer = (): void => {
  clearInterval(intervalHandle);
  timerRunningSignal.value = false;
  timerSecondsSignal.value = 0;
};
