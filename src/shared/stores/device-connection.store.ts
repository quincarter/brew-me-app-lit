import { computed, signal } from "@lit-labs/preact-signals";
import { BookooMonitorConnection } from "../ble/bookoo-monitor";
import { BookooScaleConnection } from "../ble/bookoo-scale";
import type { BookooConnectionState } from "../interfaces/bookoo-ble.interface";
import { isWebBluetoothSupported } from "../utilities/web-bluetooth.utility";
import { recordMonitorReading, recordScaleReading } from "./telemetry.store";

export const scaleConnectionStateSignal = signal<BookooConnectionState>("disconnected");
export const monitorConnectionStateSignal = signal<BookooConnectionState>("disconnected");

export const scaleConnectedSignal = computed(
  () => scaleConnectionStateSignal.value === "connected",
);
export const monitorConnectedSignal = computed(
  () => monitorConnectionStateSignal.value === "connected",
);

/**
 * True once either device has connected at least once this tab session -
 * unlike `scaleConnectedSignal`/`monitorConnectedSignal`, this never flips
 * back to false on disconnect, so UI gated on it (e.g. the extraction chart)
 * stays visible showing the frozen final curve after a mid-/post-session
 * disconnect instead of disappearing. Only a full reload clears it.
 */
export const anyDeviceConnectedThisSessionSignal = signal(false);

const DEVICES_BANNER_DISMISSED_KEY = "brewme-devices-banner-dismissed-forever";

const readBannerPermanentlyDismissed = (): boolean =>
  localStorage.getItem(DEVICES_BANNER_DISMISSED_KEY) === "true";

/**
 * Whether the Timer page's "connect your devices" banner is hidden - devices are optional, so
 * once someone dismisses it we shouldn't keep pushing the dial/controls down on every visit.
 * Seeded from `localStorage` so a "Never show again" dismissal survives reload; the banner's
 * own quick-dismiss (X) only flips this in memory for the rest of the tab session and doesn't
 * touch storage, since pairing itself is per-session anyway (this app doesn't persist/
 * auto-reconnect a previously paired device).
 */
export const devicesBannerDismissedSignal = signal(readBannerPermanentlyDismissed());

/** Session-only dismiss (the banner's close button) - hides it for this tab, returns on reload. */
export const dismissDevicesBanner = (): void => {
  devicesBannerDismissedSignal.value = true;
};

/** Permanent dismiss ("Never show again") - persists across reloads via localStorage. */
export const neverShowDevicesBannerAgain = (): void => {
  localStorage.setItem(DEVICES_BANNER_DISMISSED_KEY, "true");
  devicesBannerDismissedSignal.value = true;
};

let scaleConnection: BookooScaleConnection | null = null;
let monitorConnection: BookooMonitorConnection | null = null;

/**
 * `BookooScaleConnection`/`BookooMonitorConnection.connect()` has no cancellation awareness -
 * if a user hits "Cancel" mid-connect (calling `disconnect()` while `connect()` is still
 * in flight), the outstanding promise can still resolve afterwards and call
 * `setState("connected")`, silently reconnecting behind the cancel. These flags, set when
 * `disconnect()` is called during "connecting" and cleared at the start of the next `connect()`,
 * let the `onStateChange` listener below immediately tear a late "connected" back down instead
 * of ever exposing it to the UI.
 */
let scaleCancelRequested = false;
let monitorCancelRequested = false;

/** Constructed lazily (not at module load) so this store stays inert on unsupported browsers and in tests. */
const getScaleConnection = (): BookooScaleConnection => {
  if (!scaleConnection) {
    scaleConnection = new BookooScaleConnection();
    scaleConnection.onStateChange((state) => {
      if (state === "connected" && scaleCancelRequested) {
        scaleCancelRequested = false;
        scaleConnection?.disconnect();
        return;
      }
      scaleConnectionStateSignal.value = state;
      if (state === "connected") anyDeviceConnectedThisSessionSignal.value = true;
    });
    scaleConnection.onReading(recordScaleReading);
  }
  return scaleConnection;
};

const getMonitorConnection = (): BookooMonitorConnection => {
  if (!monitorConnection) {
    monitorConnection = new BookooMonitorConnection();
    monitorConnection.onStateChange((state) => {
      if (state === "connected" && monitorCancelRequested) {
        monitorCancelRequested = false;
        monitorConnection?.disconnect();
        return;
      }
      monitorConnectionStateSignal.value = state;
      if (state === "connected") anyDeviceConnectedThisSessionSignal.value = true;
    });
    monitorConnection.onReading(recordMonitorReading);
  }
  return monitorConnection;
};

export const connectScale = async (): Promise<void> => {
  if (!isWebBluetoothSupported()) return;
  scaleCancelRequested = false;
  try {
    await getScaleConnection().connect();
  } catch (error) {
    // A user cancelling the native device chooser (or any connect failure) already reverts
    // state to "disconnected" via the connection's own teardown - only genuine failures are
    // worth surfacing here.
    if (!(error instanceof DOMException && error.name === "NotFoundError")) {
      console.error("Failed to connect Bookoo Scale:", error);
    }
  }
};

export const disconnectScale = async (): Promise<void> => {
  if (scaleConnectionStateSignal.value === "connecting") scaleCancelRequested = true;
  scaleConnection?.disconnect();
};

export const connectMonitor = async (): Promise<void> => {
  if (!isWebBluetoothSupported()) return;
  monitorCancelRequested = false;
  try {
    await getMonitorConnection().connect();
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "NotFoundError")) {
      console.error("Failed to connect Bookoo Espresso Monitor:", error);
    }
  }
};

export const disconnectMonitor = async (): Promise<void> => {
  if (monitorConnectionStateSignal.value === "connecting") monitorCancelRequested = true;
  monitorConnection?.disconnect();
};
