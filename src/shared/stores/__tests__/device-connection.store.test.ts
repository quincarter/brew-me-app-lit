/// <reference types="web-bluetooth" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  BookooConnectionState,
  IBookooMonitorReading,
  IBookooScaleReading,
} from "../../interfaces/bookoo-ble.interface";

/**
 * `device-connection.store.ts` builds its `BookooScaleConnection`/`BookooMonitorConnection`
 * singletons lazily from the real BLE wrapper classes, which in turn talk to
 * `navigator.bluetooth`. Driving those through a fully faked GATT chain (as
 * `bookoo-scale.test.ts`/`bookoo-monitor.test.ts` already do for the wrapper classes
 * themselves) would mostly re-test that lower layer. Instead we replace the wrapper
 * classes themselves with small controllable fakes exposing the same
 * `onStateChange`/`onReading`/`connect`/`disconnect` surface the store actually calls,
 * so these tests focus on the store's own logic: lazy singleton construction, wiring
 * connection state/readings into signals, `isWebBluetoothSupported` gating, and
 * `NotFoundError` swallowing.
 */
const { FakeScaleConnection, FakeMonitorConnection, fakeScaleInstances, fakeMonitorInstances } =
  vi.hoisted(() => {
    class FakeScaleConnection {
      readonly stateListeners = new Set<(state: BookooConnectionState) => void>();
      readonly readingListeners = new Set<(reading: IBookooScaleReading) => void>();
      /** Overridable per test; default mimics a normal successful pairing. */
      connectImpl: () => Promise<void> = async () => {
        this.emitState("connecting");
        this.emitState("connected");
      };

      onStateChange(listener: (state: BookooConnectionState) => void): () => void {
        this.stateListeners.add(listener);
        return () => this.stateListeners.delete(listener);
      }

      onReading(listener: (reading: IBookooScaleReading) => void): () => void {
        this.readingListeners.add(listener);
        return () => this.readingListeners.delete(listener);
      }

      connect(): Promise<void> {
        return this.connectImpl();
      }

      readonly disconnect = vi.fn((): void => {
        this.emitState("disconnected");
      });

      emitState(state: BookooConnectionState): void {
        for (const listener of this.stateListeners) listener(state);
      }

      emitReading(reading: IBookooScaleReading): void {
        for (const listener of this.readingListeners) listener(reading);
      }
    }

    class FakeMonitorConnection {
      readonly stateListeners = new Set<(state: BookooConnectionState) => void>();
      readonly readingListeners = new Set<(reading: IBookooMonitorReading) => void>();
      connectImpl: () => Promise<void> = async () => {
        this.emitState("connecting");
        this.emitState("connected");
      };

      onStateChange(listener: (state: BookooConnectionState) => void): () => void {
        this.stateListeners.add(listener);
        return () => this.stateListeners.delete(listener);
      }

      onReading(listener: (reading: IBookooMonitorReading) => void): () => void {
        this.readingListeners.add(listener);
        return () => this.readingListeners.delete(listener);
      }

      connect(): Promise<void> {
        return this.connectImpl();
      }

      readonly disconnect = vi.fn((): void => {
        this.emitState("disconnected");
      });

      emitState(state: BookooConnectionState): void {
        for (const listener of this.stateListeners) listener(state);
      }

      emitReading(reading: IBookooMonitorReading): void {
        for (const listener of this.readingListeners) listener(reading);
      }
    }

    const fakeScaleInstances: FakeScaleConnection[] = [];
    const fakeMonitorInstances: FakeMonitorConnection[] = [];

    return { FakeScaleConnection, FakeMonitorConnection, fakeScaleInstances, fakeMonitorInstances };
  });

vi.mock("../../ble/bookoo-scale", () => ({
  BookooScaleConnection: class extends FakeScaleConnection {
    constructor() {
      super();
      fakeScaleInstances.push(this);
    }
  },
}));

vi.mock("../../ble/bookoo-monitor", () => ({
  BookooMonitorConnection: class extends FakeMonitorConnection {
    constructor() {
      super();
      fakeMonitorInstances.push(this);
    }
  },
}));

const {
  connectMonitor,
  connectScale,
  devicesBannerDismissedSignal,
  disconnectMonitor,
  disconnectScale,
  dismissDevicesBanner,
  monitorConnectedSignal,
  monitorConnectionStateSignal,
  neverShowDevicesBannerAgain,
  scaleConnectedSignal,
  scaleConnectionStateSignal,
} = await import("../device-connection.store");

const DEVICES_BANNER_DISMISSED_KEY = "brewme-devices-banner-dismissed-forever";
const { clearTelemetry, latestMonitorReadingSignal, latestScaleReadingSignal } =
  await import("../telemetry.store");

const scaleReading: IBookooScaleReading = {
  timeMs: 500,
  weightGrams: 18.2,
  flowRateGramsPerSecond: 0.4,
  batteryPercent: 77,
};

const monitorReading: IBookooMonitorReading = {
  pressureBar: 9.1,
  batteryPercent: 88,
};

// `Array.prototype.at` needs a newer `lib` target than this project's tsconfig ships with -
// plain index access into the most-recently-pushed instance instead.
const lastScaleInstance = (): InstanceType<typeof FakeScaleConnection> | undefined =>
  fakeScaleInstances[fakeScaleInstances.length - 1];
const lastMonitorInstance = (): InstanceType<typeof FakeMonitorConnection> | undefined =>
  fakeMonitorInstances[fakeMonitorInstances.length - 1];

describe("device-connection.store", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "bluetooth");
    scaleConnectionStateSignal.value = "disconnected";
    monitorConnectionStateSignal.value = "disconnected";
    devicesBannerDismissedSignal.value = false;
    localStorage.removeItem(DEVICES_BANNER_DISMISSED_KEY);
    clearTelemetry();
    vi.restoreAllMocks();
  });

  // Runs first, deliberately: the store's singleton connection is constructed lazily on the
  // first-ever connect call and never torn back down to null, so once later tests connect it
  // stays constructed for the rest of the file (same as it would across the app's lifetime
  // until a page reload). Asserting the "never connected" no-op behavior only holds before that
  // happens.
  describe("disconnect on a never-connected device", () => {
    it("disconnectScale() does not throw when the singleton hasn't been constructed yet", async () => {
      expect(fakeScaleInstances).toHaveLength(0);
      await expect(disconnectScale()).resolves.toBeUndefined();
    });

    it("disconnectMonitor() does not throw when the singleton hasn't been constructed yet", async () => {
      expect(fakeMonitorInstances).toHaveLength(0);
      await expect(disconnectMonitor()).resolves.toBeUndefined();
    });
  });

  describe("unsupported browsers", () => {
    it("connectScale() resolves without throwing and leaves state disconnected when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");

      await expect(connectScale()).resolves.toBeUndefined();

      expect(scaleConnectionStateSignal.value).toBe("disconnected");
      expect(scaleConnectedSignal.value).toBe(false);
      expect(fakeScaleInstances).toHaveLength(0);
    });

    it("connectMonitor() resolves without throwing and leaves state disconnected when Web Bluetooth is unsupported", async () => {
      Reflect.deleteProperty(navigator, "bluetooth");

      await expect(connectMonitor()).resolves.toBeUndefined();

      expect(monitorConnectionStateSignal.value).toBe("disconnected");
      expect(monitorConnectedSignal.value).toBe(false);
      expect(fakeMonitorInstances).toHaveLength(0);
    });
  });

  describe("successful connect flow", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    });

    it("transitions scaleConnectionStateSignal/scaleConnectedSignal to connected and records a reading via telemetry.store", async () => {
      expect(latestScaleReadingSignal.value).toBeNull();

      await connectScale();

      expect(scaleConnectionStateSignal.value).toBe("connected");
      expect(scaleConnectedSignal.value).toBe(true);
      expect(fakeScaleInstances).toHaveLength(1);

      // Fires the same way a real `characteristicvaluechanged` notification would once
      // decoded by the wrapper class - verifies the store wires `onReading` through to
      // telemetry.store, not just its own connection-state signal.
      fakeScaleInstances[0]?.emitReading(scaleReading);

      expect(latestScaleReadingSignal.value).toEqual(scaleReading);
    });

    it("transitions monitorConnectionStateSignal/monitorConnectedSignal to connected and records a reading via telemetry.store", async () => {
      expect(latestMonitorReadingSignal.value).toBeNull();

      await connectMonitor();

      expect(monitorConnectionStateSignal.value).toBe("connected");
      expect(monitorConnectedSignal.value).toBe(true);
      expect(fakeMonitorInstances).toHaveLength(1);

      fakeMonitorInstances[0]?.emitReading(monitorReading);

      expect(latestMonitorReadingSignal.value).toEqual(monitorReading);
    });

    it("only constructs one BookooScaleConnection across multiple connect calls (lazy singleton)", async () => {
      const instancesBefore = fakeScaleInstances.length;

      await connectScale();
      await connectScale();

      expect(fakeScaleInstances).toHaveLength(instancesBefore || 1);
    });
  });

  describe("disconnecting a connected device", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    });

    it("disconnectScale() tears the connection back down", async () => {
      await connectScale();
      expect(scaleConnectionStateSignal.value).toBe("connected");

      await disconnectScale();

      expect(scaleConnectionStateSignal.value).toBe("disconnected");
      expect(scaleConnectedSignal.value).toBe(false);
      expect(lastScaleInstance()?.disconnect).toHaveBeenCalled();
    });

    it("disconnectMonitor() tears the connection back down", async () => {
      await connectMonitor();
      expect(monitorConnectionStateSignal.value).toBe("connected");

      await disconnectMonitor();

      expect(monitorConnectionStateSignal.value).toBe("disconnected");
      expect(monitorConnectedSignal.value).toBe(false);
      expect(lastMonitorInstance()?.disconnect).toHaveBeenCalled();
    });
  });

  describe("NotFoundError handling (user cancelled the native device chooser)", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    });

    it("swallows a NotFoundError from connectScale() silently and leaves state disconnected", async () => {
      await connectScale();
      await disconnectScale();
      expect(scaleConnectionStateSignal.value).toBe("disconnected");

      const instance = lastScaleInstance();
      expect(instance).toBeDefined();
      instance!.connectImpl = async () => {
        instance!.emitState("connecting");
        instance!.emitState("disconnected");
        throw new DOMException("The user cancelled the requestDevice() chooser.", "NotFoundError");
      };
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(connectScale()).resolves.toBeUndefined();

      expect(scaleConnectionStateSignal.value).toBe("disconnected");
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("swallows a NotFoundError from connectMonitor() silently and leaves state disconnected", async () => {
      await connectMonitor();
      await disconnectMonitor();
      expect(monitorConnectionStateSignal.value).toBe("disconnected");

      const instance = lastMonitorInstance();
      expect(instance).toBeDefined();
      instance!.connectImpl = async () => {
        instance!.emitState("connecting");
        instance!.emitState("disconnected");
        throw new DOMException("The user cancelled the requestDevice() chooser.", "NotFoundError");
      };
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(connectMonitor()).resolves.toBeUndefined();

      expect(monitorConnectionStateSignal.value).toBe("disconnected");
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("logs a non-NotFoundError connect failure to console.error instead of swallowing it", async () => {
      await connectScale();
      await disconnectScale();

      const instance = lastScaleInstance();
      expect(instance).toBeDefined();
      const failure = new Error("GATT server is unavailable");
      instance!.connectImpl = async () => {
        instance!.emitState("connecting");
        instance!.emitState("disconnected");
        throw failure;
      };
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(connectScale()).resolves.toBeUndefined();

      expect(scaleConnectionStateSignal.value).toBe("disconnected");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to connect Bookoo Scale:", failure);
    });

    it("logs a non-NotFoundError monitor connect failure to console.error instead of swallowing it", async () => {
      await connectMonitor();
      await disconnectMonitor();

      const instance = lastMonitorInstance();
      expect(instance).toBeDefined();
      const failure = new Error("GATT server is unavailable");
      instance!.connectImpl = async () => {
        instance!.emitState("connecting");
        instance!.emitState("disconnected");
        throw failure;
      };
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(connectMonitor()).resolves.toBeUndefined();

      expect(monitorConnectionStateSignal.value).toBe("disconnected");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to connect Bookoo Espresso Monitor:",
        failure,
      );
    });
  });

  describe("cancelling mid-connect", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    });

    it("does not resurrect a connected state if the in-flight connect() resolves after disconnectScale() was called", async () => {
      // Establish the singleton with one normal connect/disconnect cycle first, then swap in
      // a connectImpl that stalls at "connecting" until released - simulating a native
      // chooser/GATT handshake still in flight when the user hits Cancel.
      await connectScale();
      await disconnectScale();

      const instance = lastScaleInstance();
      expect(instance).toBeDefined();
      let releaseConnect: () => void = () => {};
      const connectGate = new Promise<void>((resolve) => {
        releaseConnect = resolve;
      });
      instance!.connectImpl = async () => {
        instance!.emitState("connecting");
        await connectGate;
        // Resolves *after* the cancel below has already called disconnect() - the store must
        // not let this late "connected" reach the UI signal.
        instance!.emitState("connected");
      };

      const connectPromise = connectScale();
      await Promise.resolve(); // let connectImpl reach and emit "connecting"
      expect(scaleConnectionStateSignal.value).toBe("connecting");

      await disconnectScale();
      expect(scaleConnectionStateSignal.value).toBe("disconnected");

      releaseConnect();
      await connectPromise;

      expect(scaleConnectionStateSignal.value).toBe("disconnected");
      expect(scaleConnectedSignal.value).toBe(false);
    });
  });

  describe("devicesBannerDismissedSignal / dismissDevicesBanner", () => {
    it("defaults to not dismissed", () => {
      expect(devicesBannerDismissedSignal.value).toBe(false);
    });

    it("flips to dismissed and stays there until reset", () => {
      dismissDevicesBanner();
      expect(devicesBannerDismissedSignal.value).toBe(true);

      dismissDevicesBanner();
      expect(devicesBannerDismissedSignal.value).toBe(true);
    });

    it("dismissDevicesBanner() does not touch localStorage - a session-only dismiss", () => {
      dismissDevicesBanner();

      expect(localStorage.getItem(DEVICES_BANNER_DISMISSED_KEY)).toBeNull();
    });
  });

  describe("neverShowDevicesBannerAgain", () => {
    it("dismisses the banner and persists the flag to localStorage", () => {
      expect(devicesBannerDismissedSignal.value).toBe(false);

      neverShowDevicesBannerAgain();

      expect(devicesBannerDismissedSignal.value).toBe(true);
      expect(localStorage.getItem(DEVICES_BANNER_DISMISSED_KEY)).toBe("true");
    });
  });

  describe("devicesBannerDismissedSignal seeding on module load", () => {
    beforeEach(() => {
      localStorage.removeItem(DEVICES_BANNER_DISMISSED_KEY);
      vi.resetModules();
    });

    it("seeds as dismissed when localStorage already has the persisted flag", async () => {
      localStorage.setItem(DEVICES_BANNER_DISMISSED_KEY, "true");

      const freshStore = await import("../device-connection.store");

      expect(freshStore.devicesBannerDismissedSignal.value).toBe(true);
    });

    it("seeds as not dismissed when localStorage has no flag", async () => {
      const freshStore = await import("../device-connection.store");

      expect(freshStore.devicesBannerDismissedSignal.value).toBe(false);
    });
  });
});
