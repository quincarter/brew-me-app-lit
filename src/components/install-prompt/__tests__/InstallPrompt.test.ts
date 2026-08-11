import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOfflineReadySignal } from "../../../shared/utilities/register-service-worker.utility";
import {
  deferredInstallPromptSignal,
  installPromptSnoozedSignal,
  isStandaloneSignal,
} from "../../../shared/stores/install-prompt.store";
import "../brew-install-prompt";
import type { InstallPrompt } from "../InstallPrompt";

/** Matches the shape of the (not-yet-in-lib.dom) `beforeinstallprompt` event the store expects. */
class FakeBeforeInstallPromptEvent extends Event {
  prompt = vi.fn(async () => {});
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> = Promise.resolve({
    outcome: "accepted",
    platform: "web",
  });

  constructor() {
    super("beforeinstallprompt", { cancelable: true });
  }
}

describe("brew-install-prompt", () => {
  let element: InstallPrompt;

  /** Flips every `canShowInstallPromptSignal` dependency to the "show it" state. */
  const makePromptShowable = (): void => {
    deferredInstallPromptSignal.value = new FakeBeforeInstallPromptEvent();
    isStandaloneSignal.value = false;
    installPromptSnoozedSignal.value = false;
    isOfflineReadySignal.value = true;
  };

  beforeEach(async () => {
    localStorage.clear();
    deferredInstallPromptSignal.value = null;
    isStandaloneSignal.value = false;
    installPromptSnoozedSignal.value = false;
    isOfflineReadySignal.value = false;

    element = document.createElement("brew-install-prompt") as InstallPrompt;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    deferredInstallPromptSignal.value = null;
    isStandaloneSignal.value = false;
    installPromptSnoozedSignal.value = false;
    isOfflineReadySignal.value = false;
  });

  it("renders the brew-bottom-sheet closed when the prompt shouldn't show", () => {
    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet).not.toBeNull();
    expect(sheet?.hasAttribute("open")).toBe(false);
  });

  it("opens the brew-bottom-sheet with the app pitch when the prompt should show", async () => {
    makePromptShowable();
    await element.updateComplete;

    const sheet = element.shadowRoot?.querySelector("brew-bottom-sheet");
    expect(sheet?.hasAttribute("open")).toBe(true);
    expect(sheet?.getAttribute("label")).toBe("Install BrewMe");
    expect(element.shadowRoot?.querySelector(".app-name")?.textContent).toBe("BrewMe");
  });

  it("dismisses (snoozes) the prompt when the close icon-button is clicked", async () => {
    makePromptShowable();
    await element.updateComplete;

    const closeButton = element.shadowRoot?.querySelector(".header brew-icon-button");
    const innerButton = closeButton?.shadowRoot?.querySelector("button");
    if (!innerButton) throw new Error("expected the close icon-button's inner button");

    innerButton.click();

    expect(installPromptSnoozedSignal.value).toBe(true);
  });

  it("dismisses (snoozes) the prompt when Escape triggers the nested dialog's cancel event", async () => {
    makePromptShowable();
    await element.updateComplete;

    const dialog = element.shadowRoot
      ?.querySelector("brew-bottom-sheet")
      ?.shadowRoot?.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));

    expect(installPromptSnoozedSignal.value).toBe(true);
  });

  it("triggers the native install prompt when Install is clicked", async () => {
    const event = new FakeBeforeInstallPromptEvent();
    deferredInstallPromptSignal.value = event;
    isStandaloneSignal.value = false;
    installPromptSnoozedSignal.value = false;
    isOfflineReadySignal.value = true;
    await element.updateComplete;

    const installButton = Array.from(
      element.shadowRoot?.querySelectorAll(".actions brew-button") ?? [],
    ).find((button) => button.textContent?.trim() === "Install");
    const innerButton = installButton?.shadowRoot?.querySelector("button");
    if (!innerButton) throw new Error("expected the Install button's inner button");

    innerButton.click();
    await Promise.resolve();

    expect(event.prompt).toHaveBeenCalledTimes(1);
  });
});
