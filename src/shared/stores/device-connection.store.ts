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
