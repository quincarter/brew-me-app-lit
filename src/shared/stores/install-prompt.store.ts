import { computed, signal } from "@lit-labs/preact-signals";

const DISMISSED_UNTIL_KEY = "brewme-install-dismissed-until";
const SNOOZE_DAYS = 7;

/**
 * The `beforeinstallprompt` event isn't in TypeScript's DOM lib yet - it's a
 * Chromium/Android-only extension of `Event` that exposes `prompt()` and a
 * `userChoice` promise.
 */
interface IBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: IBeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

/** The captured browser install event, once fired. Null until then (or after it's been used/dismissed). */
export const deferredInstallPromptSignal = signal<IBeforeInstallPromptEvent | null>(null);

/** True once the app is actually running as an installed/standalone PWA. */
export const isStandaloneSignal = signal(false);

/** True if the user dismissed the custom prompt within the current snooze window. */
export const installPromptSnoozedSignal = signal(readSnoozeState());

/** Whether `brew-install-prompt` should render right now. */
export const canShowInstallPromptSignal = computed(
  () =>
    deferredInstallPromptSignal.value !== null &&
    !isStandaloneSignal.value &&
    !installPromptSnoozedSignal.value,
);

function readSnoozeState(): boolean {
  const raw = localStorage.getItem(DISMISSED_UNTIL_KEY);
  if (!raw) return false;
  const until = Number.parseInt(raw, 10);
  return Number.isFinite(until) && Date.now() < until;
}

function detectStandalone(): boolean {
  const isDisplayModeStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  // iOS Safari's legacy home-screen flag - not part of the display-mode media feature.
  const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isDisplayModeStandalone || isIosStandalone;
}

let listenerAttached = false;

/**
 * Wires up the two browser events the custom install prompt needs. Call once
 * (from `app-shell.ts`) before `brew-install-prompt` is rendered, so the
 * `beforeinstallprompt` event is never missed while nothing is listening yet.
 */
export const initInstallPromptListener = (): void => {
  if (listenerAttached) return;
  listenerAttached = true;

  isStandaloneSignal.value = detectStandalone();

  window.addEventListener("beforeinstallprompt", (event) => {
    // Stop Chrome's built-in mini-infobar so only our themed UI shows up.
    event.preventDefault();
    deferredInstallPromptSignal.value = event as IBeforeInstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPromptSignal.value = null;
    isStandaloneSignal.value = true;
  });

  window.matchMedia?.("(display-mode: standalone)").addEventListener("change", (event) => {
    isStandaloneSignal.value = event.matches;
  });
};

/** Triggers the real browser install dialog from a user gesture (the custom "Install" button). */
export const promptInstall = async (): Promise<void> => {
  const event = deferredInstallPromptSignal.value;
  if (!event) return;

  await event.prompt();
  await event.userChoice;
  // Each `beforeinstallprompt` event can only be used once, win or lose.
  deferredInstallPromptSignal.value = null;
};

/** Hides the custom prompt for `SNOOZE_DAYS` after the user dismisses it. */
export const dismissInstallPrompt = (): void => {
  const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISSED_UNTIL_KEY, String(until));
  installPromptSnoozedSignal.value = true;
};
