import { signal } from "@lit-labs/preact-signals";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ICloudSyncState } from "../../../shared/interfaces/cloud-sync.interface";

const cloudSyncStateSignal = signal<ICloudSyncState>({
  activeProviderId: null,
  connections: {},
  statuses: {},
});
const connectProvider = vi.fn().mockResolvedValue(undefined);
const disconnectProvider = vi.fn();
const syncNow = vi.fn().mockResolvedValue(undefined);

vi.mock("../../../shared/stores/cloud-sync.store", () => ({
  get cloudSyncStateSignal() {
    return cloudSyncStateSignal;
  },
  connectProvider: (...args: unknown[]) => connectProvider(...args),
  disconnectProvider: (...args: unknown[]) => disconnectProvider(...args),
  syncNow: (...args: unknown[]) => syncNow(...args),
}));

const { CloudSyncPage } = await import("../cloud-sync-page");

describe("cloud-sync-page", () => {
  let element: InstanceType<typeof CloudSyncPage>;

  beforeEach(async () => {
    cloudSyncStateSignal.value = { activeProviderId: null, connections: {}, statuses: {} };
    connectProvider.mockClear();
    disconnectProvider.mockClear();
    syncNow.mockClear();
    // Stubbed explicitly so every row's visibility is deterministic
    // regardless of what's actually configured in a real local `.env` on
    // the machine running the suite (see cloud-provider-config.utility.ts).
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "test-client-id");
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "test-client-id");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");

    element = document.createElement("cloud-sync-page") as InstanceType<typeof CloudSyncPage>;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.unstubAllEnvs();
  });

  it("renders the bottom nav with 'more' highlighted, matching Settings (which this screen is reached from)", () => {
    const nav = element.shadowRoot?.querySelector("brew-bottom-nav");
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute("active")).toBe("more");
  });

  it("renders enabled Dropbox, OneDrive, and Google Drive rows and no 'Sync now' section while disconnected", () => {
    const rows = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row");
    expect(rows).toHaveLength(3);
    expect(rows?.[0].getAttribute("provider")).toBe("dropbox");
    expect(rows?.[0].hasAttribute("connected")).toBe(false);
    expect(rows?.[0].hasAttribute("disabled")).toBe(false);
    expect(rows?.[1].getAttribute("provider")).toBe("onedrive");
    expect(rows?.[1].hasAttribute("disabled")).toBe(false);
    expect(rows?.[2].getAttribute("provider")).toBe("google-drive");
    expect(rows?.[2].hasAttribute("disabled")).toBe(false);

    expect(element.shadowRoot?.querySelector(".sync-now-row")).toBeNull();
  });

  it("shows the Google Drive persistent reconnect note regardless of connection state", () => {
    const googleDriveRow = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")[2];
    expect(googleDriveRow?.getAttribute("note")).toBe("May need reconnecting periodically.");

    const dropboxRow = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")[0];
    expect(dropboxRow?.getAttribute("note")).toBeFalsy();
  });

  it("calls connectProvider('dropbox') when the Dropbox row fires connect-click", async () => {
    const dropboxRow = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")[0];
    dropboxRow?.dispatchEvent(new CustomEvent("connect-click", { bubbles: true, composed: true }));

    expect(connectProvider).toHaveBeenCalledWith("dropbox");
  });

  it("calls connectProvider('onedrive') when the OneDrive row fires connect-click", async () => {
    const oneDriveRow = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")[1];
    oneDriveRow?.dispatchEvent(new CustomEvent("connect-click", { bubbles: true, composed: true }));

    expect(connectProvider).toHaveBeenCalledWith("onedrive");
  });

  it("calls connectProvider('google-drive') when the Google Drive row fires connect-click", async () => {
    const googleDriveRow = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")[2];
    googleDriveRow?.dispatchEvent(
      new CustomEvent("connect-click", { bubbles: true, composed: true }),
    );

    expect(connectProvider).toHaveBeenCalledWith("google-drive");
  });

  it("calls disconnectProvider('dropbox') when the Dropbox row fires disconnect-click", async () => {
    const dropboxRow = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")[0];
    dropboxRow?.dispatchEvent(
      new CustomEvent("disconnect-click", { bubbles: true, composed: true }),
    );

    expect(disconnectProvider).toHaveBeenCalledWith("dropbox");
  });

  it("calls disconnectProvider('onedrive') when the OneDrive row fires disconnect-click", async () => {
    const oneDriveRow = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")[1];
    oneDriveRow?.dispatchEvent(
      new CustomEvent("disconnect-click", { bubbles: true, composed: true }),
    );

    expect(disconnectProvider).toHaveBeenCalledWith("onedrive");
  });

  it("shows a 'Sync now' button and last-synced text keyed off whichever provider is active", async () => {
    cloudSyncStateSignal.value = {
      activeProviderId: "onedrive",
      connections: { onedrive: { providerId: "onedrive", connectedAt: 1, tokens: {} as never } },
      statuses: { onedrive: { status: "idle", lastSyncedAt: Date.now() } },
    };
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row");
    expect(rows?.[1].hasAttribute("connected")).toBe(true);
    expect(rows?.[0].hasAttribute("connected")).toBe(false);

    const syncButton = element.shadowRoot?.querySelector(".sync-now-row brew-button");
    expect(syncButton?.textContent?.trim()).toBe("Sync now");

    const inner = syncButton?.shadowRoot?.querySelector("button");
    inner?.dispatchEvent(new Event("click", { bubbles: true }));

    expect(syncNow).toHaveBeenCalledTimes(1);
  });

  it("shows the sync error message when the active provider's status is an error", async () => {
    cloudSyncStateSignal.value = {
      activeProviderId: "google-drive",
      connections: {
        "google-drive": { providerId: "google-drive", connectedAt: 1, tokens: {} as never },
      },
      statuses: { "google-drive": { status: "error", lastError: "Session expired." } },
    };
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".status-text.error")?.textContent).toBe(
      "Session expired.",
    );
  });

  it("only renders rows for providers with a configured client id", async () => {
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    element.requestUpdate();
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row");
    expect(rows).toHaveLength(1);
    expect(rows?.[0].getAttribute("provider")).toBe("dropbox");
  });

  it("shows a message instead of any rows when no provider is configured at all", async () => {
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    element.requestUpdate();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelectorAll("brew-cloud-sync-provider-row")).toHaveLength(0);
    expect(element.shadowRoot?.querySelector(".rows")).toBeNull();
    expect(element.shadowRoot?.textContent).toContain("No cloud providers are configured");
  });
});
