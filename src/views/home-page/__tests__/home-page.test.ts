import "fake-indexeddb/auto";
import type { SVGTemplateResult } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLOUD_DONE_ICON_SVG,
  CLOUD_ICON_SVG,
  CLOUD_OFF_ICON_SVG,
} from "../../../shared/icons/icons";
import { savedBrewsSignal } from "../../../shared/stores/brew.store";
import { cloudSyncStateSignal } from "../../../shared/stores/cloud-sync.store";
import { deviceConnectSheetOpenSignal } from "../../../shared/stores/device-connect-sheet.store";
import "../home-page";
import type { HomePage } from "../home-page";

describe("home-page", () => {
  let element: HomePage;

  const mount = async (): Promise<void> => {
    element = document.createElement("home-page") as HomePage;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  beforeEach(() => {
    savedBrewsSignal.value = [];
    deviceConnectSheetOpenSignal.value = false;
    cloudSyncStateSignal.value = { activeProviderId: null, connections: {}, statuses: {} };
    // Stubbed explicitly (not left to whatever's in a real local `.env`) so
    // the Cloud Sync tile's visibility is deterministic regardless of the
    // machine running the suite - a real `.env` with a real client id would
    // otherwise leak into `import.meta.env` here and mask the "hidden when
    // unconfigured" tests below from ever actually exercising that path.
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "test-client-id");
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
  });

  afterEach(() => {
    element.remove();
    Reflect.deleteProperty(navigator, "bluetooth");
    deviceConnectSheetOpenSignal.value = false;
    vi.unstubAllEnvs();
  });

  const actionTileByLabel = (label: string): (HTMLElement & { label: string }) | null => {
    const tiles = element.shadowRoot?.querySelectorAll(".secondary-actions brew-action-tile") ?? [];
    return (
      ([...tiles] as (HTMLElement & { label: string })[]).find((tile) => tile.label === label) ??
      null
    );
  };
  const devicesTile = (): (HTMLElement & { label: string }) | null => actionTileByLabel("Devices");
  type CloudSyncTileElement = HTMLElement & {
    label: string;
    sublabel: string;
    href: string;
    svg: SVGTemplateResult | null;
  };
  const cloudSyncTile = (): CloudSyncTileElement | null =>
    actionTileByLabel("Cloud Sync") as CloudSyncTileElement | null;

  describe("Devices tile", () => {
    it("does not render when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      await mount();

      expect(devicesTile()).toBeNull();
    });

    it("renders with the 'Devices' label when Web Bluetooth is supported", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      const tile = devicesTile();
      expect(tile).not.toBeNull();
      expect(tile?.label).toBe("Devices");
    });

    it("opens the device connect sheet when activated", async () => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
      await mount();

      expect(deviceConnectSheetOpenSignal.value).toBe(false);

      devicesTile()?.dispatchEvent(
        new CustomEvent("tile-click", { bubbles: true, composed: true }),
      );

      expect(deviceConnectSheetOpenSignal.value).toBe(true);
    });
  });

  describe("Cloud Sync tile", () => {
    it("renders on the same row as Devices, even when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      await mount();

      const tile = cloudSyncTile();
      expect(tile).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".secondary-actions")).not.toBeNull();
    });

    it("links to /more/cloud-sync", async () => {
      await mount();

      expect(cloudSyncTile()?.href).toBe("/more/cloud-sync");
    });

    it("shows 'Not connected' and the cloud-off icon when no provider is connected", async () => {
      await mount();

      expect(cloudSyncTile()?.sublabel).toBe("Not connected");
      expect(cloudSyncTile()?.svg).toBe(CLOUD_OFF_ICON_SVG);
    });

    it("shows the provider, 'Not synced yet', and the generic cloud icon right after connecting, before any sync has completed", async () => {
      cloudSyncStateSignal.value = {
        activeProviderId: "dropbox",
        connections: {},
        statuses: {},
      };
      await mount();

      expect(cloudSyncTile()?.sublabel).toBe("Dropbox · Not synced yet");
      expect(cloudSyncTile()?.svg).toBe(CLOUD_ICON_SVG);
    });

    it("shows 'Syncing…' and the generic cloud icon while a sync is in flight", async () => {
      cloudSyncStateSignal.value = {
        activeProviderId: "dropbox",
        connections: {},
        statuses: { dropbox: { status: "syncing" } },
      };
      await mount();

      expect(cloudSyncTile()?.sublabel).toBe("Dropbox · Syncing…");
      expect(cloudSyncTile()?.svg).toBe(CLOUD_ICON_SVG);
    });

    it("shows a relative last-synced time and the cloud-done icon once idle with a completed sync", async () => {
      cloudSyncStateSignal.value = {
        activeProviderId: "dropbox",
        connections: {},
        statuses: { dropbox: { status: "idle", lastSyncedAt: Date.now() } },
      };
      await mount();

      expect(cloudSyncTile()?.sublabel).toMatch(/^Dropbox · Synced/);
      expect(cloudSyncTile()?.svg).toBe(CLOUD_DONE_ICON_SVG);
    });

    it("shows a short sync-error summary and the cloud-off icon, rather than the full error message", async () => {
      cloudSyncStateSignal.value = {
        activeProviderId: "dropbox",
        connections: {},
        statuses: { dropbox: { status: "error", lastError: "Dropbox session expired." } },
      };
      await mount();

      expect(cloudSyncTile()?.sublabel).toBe("Dropbox · Sync error");
      expect(cloudSyncTile()?.svg).toBe(CLOUD_OFF_ICON_SVG);
    });

    it("is hidden entirely when no cloud provider has a configured client id", async () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      await mount();

      expect(cloudSyncTile()).toBeNull();
    });

    it("hides the whole secondary-actions row when neither Devices nor Cloud Sync would render", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      await mount();

      expect(element.shadowRoot?.querySelector(".secondary-actions")).toBeNull();
    });
  });
});
