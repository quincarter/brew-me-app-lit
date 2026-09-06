import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../brew-cloud-sync-provider-row";
import type { CloudSyncProviderRow } from "../CloudSyncProviderRow";

describe("brew-cloud-sync-provider-row", () => {
  let element: CloudSyncProviderRow;

  beforeEach(async () => {
    element = document.createElement("brew-cloud-sync-provider-row") as CloudSyncProviderRow;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the provider label and a Connect button while disconnected", async () => {
    element.provider = "dropbox";
    element.connected = false;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".headline")?.textContent).toBe("Dropbox");
    expect(element.shadowRoot?.querySelector(".supporting")?.textContent).toBe("Not connected");
    expect(element.shadowRoot?.querySelector("brew-button")?.textContent?.trim()).toBe("Connect");
  });

  it("fires connect-click when the Connect button is activated", async () => {
    const listener = vi.fn();
    element.addEventListener("connect-click", listener);

    const button = element.shadowRoot?.querySelector("brew-button");
    button?.dispatchEvent(new CustomEvent("button-click", { bubbles: true, composed: true }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("renders an account label and a disconnect icon button while connected", async () => {
    element.provider = "dropbox";
    element.connected = true;
    element.accountLabel = "quin@example.com";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".supporting")?.textContent).toBe("quin@example.com");
    expect(element.shadowRoot?.querySelector("brew-button")).toBeNull();
    expect(element.shadowRoot?.querySelector("brew-icon-button")).not.toBeNull();
  });

  it("fires disconnect-click when the disconnect icon button is activated", async () => {
    element.connected = true;
    await element.updateComplete;

    const listener = vi.fn();
    element.addEventListener("disconnect-click", listener);

    const iconButton = element.shadowRoot?.querySelector("brew-icon-button");
    iconButton?.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("shows a status error message instead of the account label when status is an error", async () => {
    element.connected = true;
    element.accountLabel = "quin@example.com";
    element.status = { status: "error", lastError: "Session expired." };
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".supporting")?.textContent).toBe("Session expired.");
    expect(element.shadowRoot?.querySelector(".supporting")?.classList.contains("error")).toBe(
      true,
    );
  });

  it("shows a connect-time error instead of 'Not connected', even though connecting never succeeded", async () => {
    // Regression test: a failed connect attempt (e.g. a missing client id)
    // leaves `connected: false` - the error must still take priority over
    // the "Not connected" fallback, or the failure reason is invisible.
    element.connected = false;
    element.status = { status: "error", lastError: "VITE_DROPBOX_CLIENT_ID is not configured." };
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".supporting")?.textContent).toBe(
      "VITE_DROPBOX_CLIENT_ID is not configured.",
    );
    expect(element.shadowRoot?.querySelector(".supporting")?.classList.contains("error")).toBe(
      true,
    );
  });

  it("renders a persistent note alongside the usual status text, in any connection state", async () => {
    element.provider = "google-drive";
    element.note = "May need reconnecting periodically.";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".note")?.textContent).toBe(
      "May need reconnecting periodically.",
    );

    element.connected = true;
    element.accountLabel = "quin@example.com";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".supporting")?.textContent).toBe("quin@example.com");
    expect(element.shadowRoot?.querySelector(".note")?.textContent).toBe(
      "May need reconnecting periodically.",
    );
  });

  it("renders the persistent note alongside a status error simultaneously, neither clobbering the other", async () => {
    element.provider = "google-drive";
    element.note = "May need reconnecting periodically.";
    element.connected = true;
    element.status = { status: "error", lastError: "Google Drive session expired." };
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".supporting.error")?.textContent).toBe(
      "Google Drive session expired.",
    );
    expect(element.shadowRoot?.querySelector(".note")?.textContent).toBe(
      "May need reconnecting periodically.",
    );
  });

  it("renders no note element when note is unset", async () => {
    expect(element.shadowRoot?.querySelector(".note")).toBeNull();
  });

  it("renders 'Coming soon' and never fires connect-click when disabled", async () => {
    element.provider = "onedrive";
    element.disabled = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".headline")?.textContent).toBe("OneDrive");
    expect(element.shadowRoot?.querySelector(".supporting")?.textContent).toBe("Coming soon");

    const listener = vi.fn();
    element.addEventListener("connect-click", listener);
    const button = element.shadowRoot?.querySelector("brew-button");
    button?.dispatchEvent(new CustomEvent("button-click", { bubbles: true, composed: true }));

    expect(listener).not.toHaveBeenCalled();
  });
});
