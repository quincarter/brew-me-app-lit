import { beforeEach, describe, expect, it, vi } from "vitest";
import { isOfflineReadySignal } from "../../utilities/register-service-worker.utility";
import {
  canShowInstallPromptSignal,
  deferredInstallPromptSignal,
  dismissInstallPrompt,
  installPromptSnoozedSignal,
  isStandaloneSignal,
  promptInstall,
} from "../install-prompt.store";

const DISMISSED_UNTIL_KEY = "brewme-install-dismissed-until";

/** Matches the shape of the (not-yet-in-lib.dom) `beforeinstallprompt` event the store expects. */
interface IFakeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

class FakeBeforeInstallPromptEvent extends Event implements IFakeInstallPromptEvent {
  prompt = vi.fn(async () => {});
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> = Promise.resolve({
    outcome: "accepted",
    platform: "web",
  });

  constructor() {
    super("beforeinstallprompt", { cancelable: true });
  }
}

/** Invokes a captured `addEventListener` handler directly, supporting both function and `EventListenerObject` forms. */
function invokeListener(
  listener: EventListenerOrEventListenerObject | undefined,
  event: Event,
): void {
  if (!listener) {
    throw new Error("Expected a listener to have been registered.");
  }
  if (typeof listener === "function") {
    listener(event);
  } else {
    listener.handleEvent(event);
  }
}

describe("install-prompt.store", () => {
  beforeEach(() => {
    localStorage.clear();
    deferredInstallPromptSignal.value = null;
    isStandaloneSignal.value = false;
    installPromptSnoozedSignal.value = false;
    isOfflineReadySignal.value = false;
  });

  describe("canShowInstallPromptSignal", () => {
    it("is false when no install event has been captured", () => {
      deferredInstallPromptSignal.value = null;
      isStandaloneSignal.value = false;
      installPromptSnoozedSignal.value = false;
      isOfflineReadySignal.value = true;

      expect(canShowInstallPromptSignal.value).toBe(false);
    });

    it("is false when already running standalone", () => {
      deferredInstallPromptSignal.value = new FakeBeforeInstallPromptEvent();
      isStandaloneSignal.value = true;
      installPromptSnoozedSignal.value = false;
      isOfflineReadySignal.value = true;

      expect(canShowInstallPromptSignal.value).toBe(false);
    });

    it("is false when the prompt was snoozed", () => {
      deferredInstallPromptSignal.value = new FakeBeforeInstallPromptEvent();
      isStandaloneSignal.value = false;
      installPromptSnoozedSignal.value = true;
      isOfflineReadySignal.value = true;

      expect(canShowInstallPromptSignal.value).toBe(false);
    });

    it("is false when the service worker isn't offline-ready yet", () => {
      deferredInstallPromptSignal.value = new FakeBeforeInstallPromptEvent();
      isStandaloneSignal.value = false;
      installPromptSnoozedSignal.value = false;
      isOfflineReadySignal.value = false;

      expect(canShowInstallPromptSignal.value).toBe(false);
    });

    it("is true only when all four conditions hold", () => {
      deferredInstallPromptSignal.value = new FakeBeforeInstallPromptEvent();
      isStandaloneSignal.value = false;
      installPromptSnoozedSignal.value = false;
      isOfflineReadySignal.value = true;

      expect(canShowInstallPromptSignal.value).toBe(true);
    });
  });

  describe("dismissInstallPrompt", () => {
    it("sets the snooze localStorage key and flips installPromptSnoozedSignal", () => {
      const before = Date.now();

      dismissInstallPrompt();

      const stored = localStorage.getItem(DISMISSED_UNTIL_KEY);
      expect(stored).not.toBeNull();
      const until = Number.parseInt(stored ?? "", 10);
      expect(until).toBeGreaterThan(before);
      expect(installPromptSnoozedSignal.value).toBe(true);
    });
  });

  describe("promptInstall", () => {
    it("calls prompt(), awaits userChoice, then clears the deferred event", async () => {
      const event = new FakeBeforeInstallPromptEvent();
      let userChoiceResolved = false;
      event.userChoice = event.userChoice.then((choice) => {
        userChoiceResolved = true;
        return choice;
      });
      deferredInstallPromptSignal.value = event;

      await promptInstall();

      expect(event.prompt).toHaveBeenCalledTimes(1);
      expect(userChoiceResolved).toBe(true);
      expect(deferredInstallPromptSignal.value).toBeNull();
    });

    it("does nothing when there's no deferred event", async () => {
      deferredInstallPromptSignal.value = null;

      await expect(promptInstall()).resolves.toBeUndefined();
      expect(deferredInstallPromptSignal.value).toBeNull();
    });
  });

  describe("initInstallPromptListener", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("only attaches each listener once, even when called multiple times", async () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const freshStore = await import("../install-prompt.store");

      freshStore.initInstallPromptListener();
      freshStore.initInstallPromptListener();
      freshStore.initInstallPromptListener();

      const beforeInstallCalls = addEventListenerSpy.mock.calls.filter(
        ([type]) => type === "beforeinstallprompt",
      );
      const appInstalledCalls = addEventListenerSpy.mock.calls.filter(
        ([type]) => type === "appinstalled",
      );
      expect(beforeInstallCalls).toHaveLength(1);
      expect(appInstalledCalls).toHaveLength(1);

      addEventListenerSpy.mockRestore();
    });

    it("captures the beforeinstallprompt event and prevents the default mini-infobar exactly once", async () => {
      // Earlier tests in this file attach their own real listeners to the
      // shared happy-dom `window` (nothing tears them down between tests),
      // so a real `window.dispatchEvent` here would also fire those
      // leftover listeners. Capturing this test's own handler off the spy
      // and invoking it directly keeps the assertion scoped to this test's
      // module instance only.
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const freshStore = await import("../install-prompt.store");
      freshStore.initInstallPromptListener();
      freshStore.initInstallPromptListener();

      const beforeInstallPromptListener = addEventListenerSpy.mock.calls.find(
        ([type]) => type === "beforeinstallprompt",
      )?.[1];
      addEventListenerSpy.mockRestore();

      const event = new FakeBeforeInstallPromptEvent();
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      invokeListener(beforeInstallPromptListener, event);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(freshStore.deferredInstallPromptSignal.value).toBe(event);
    });

    it("clears the deferred event and marks the app standalone on appinstalled", async () => {
      // Same leftover-listener concern as the test above - capture this
      // test's own handler off the spy and invoke it directly rather than
      // `window.dispatchEvent`, so earlier tests' un-torn-down listeners on
      // the shared happy-dom `window` can't also fire.
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const freshStore = await import("../install-prompt.store");
      freshStore.initInstallPromptListener();

      const appInstalledListener = addEventListenerSpy.mock.calls.find(
        ([type]) => type === "appinstalled",
      )?.[1];
      addEventListenerSpy.mockRestore();

      freshStore.deferredInstallPromptSignal.value = new FakeBeforeInstallPromptEvent();

      invokeListener(appInstalledListener, new Event("appinstalled"));

      expect(freshStore.deferredInstallPromptSignal.value).toBeNull();
      expect(freshStore.isStandaloneSignal.value).toBe(true);
    });
  });
});
