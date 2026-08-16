/// <reference types="web-bluetooth" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOOKOO_MONITOR_COMMAND_CHARACTERISTIC_UUID,
  BOOKOO_MONITOR_EXTRACTION_CHARACTERISTIC_UUID,
  BOOKOO_MONITOR_SERVICE_UUID,
  BookooMonitorConnection,
  MONITOR_START_EXTRACTION_COMMAND,
  MONITOR_STOP_EXTRACTION_COMMAND,
  decodeMonitorPressurePacket,
} from "../bookoo-monitor";
import type {
  BookooConnectionState,
  IBookooMonitorReading,
} from "../../interfaces/bookoo-ble.interface";

/** Overwrites the last byte of `bytes` with the documented XOR checksum of every byte before it. */
const withChecksum = (bytes: number[]): Uint8Array => {
  const packet = Uint8Array.from(bytes);
  let checksum = 0;
  for (let i = 0; i < packet.length - 1; i++) checksum ^= packet[i];
  packet[packet.length - 1] = checksum;
  return packet;
};

const toDataView = (bytes: Uint8Array): DataView =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/**
 * A valid 10-byte extraction packet: pressureBar = 9.32, batteryPercent = 90. Checksum byte
 * (last) is a placeholder, always overwritten by `withChecksum`.
 */
const VALID_EXTRACTION_PACKET_BYTES = [
  0x02, // BYTE1 - product number (unused by the decoder)
  0x1b, // BYTE2 - packet type (extraction)
  0x00,
  0x00, // BYTE3-4 - unused by the decoder
  0x03,
  0xa4, // BYTE5-6 - pressure = 932 -> 9.32 bar
  0x5a, // BYTE7 - battery = 90
  0x00,
  0x00, // BYTE8-9 - unused
  0x00, // BYTE10 - checksum placeholder
];

describe("bookoo-monitor", () => {
  describe("decodeMonitorPressurePacket", () => {
    it("decodes a valid packet", () => {
      const data = toDataView(withChecksum(VALID_EXTRACTION_PACKET_BYTES));

      expect(decodeMonitorPressurePacket(data)).toEqual<IBookooMonitorReading>({
        pressureBar: 9.32,
        batteryPercent: 90,
      });
    });

    it("returns null when the checksum byte doesn't match", () => {
      const bytes = withChecksum(VALID_EXTRACTION_PACKET_BYTES);
      bytes[bytes.length - 1] ^= 0xff;

      expect(decodeMonitorPressurePacket(toDataView(bytes))).toBeNull();
    });

    it("returns null when the packet type byte isn't 0x1B", () => {
      const bytes = [...VALID_EXTRACTION_PACKET_BYTES];
      bytes[1] = 0x1c;

      expect(decodeMonitorPressurePacket(toDataView(withChecksum(bytes)))).toBeNull();
    });

    it("returns null for a packet shorter than 10 bytes", () => {
      const shortPacket = toDataView(withChecksum(VALID_EXTRACTION_PACKET_BYTES.slice(0, 9)));

      expect(decodeMonitorPressurePacket(shortPacket)).toBeNull();
      expect(decodeMonitorPressurePacket(toDataView(new Uint8Array(0)))).toBeNull();
    });
  });

  describe("command byte constants", () => {
    it("matches the documented start-extraction command", () => {
      expect([...MONITOR_START_EXTRACTION_COMMAND]).toEqual([
        0x02, 0x0c, 0x01, 0x00, 0x00, 0x00, 0x0f,
      ]);
    });

    it("matches the documented stop-extraction command", () => {
      expect([...MONITOR_STOP_EXTRACTION_COMMAND]).toEqual([
        0x02, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x0e,
      ]);
    });
  });

  describe("BookooMonitorConnection", () => {
    /** Minimal fakes implementing just the Web Bluetooth surface the connection actually calls. */
    class FakeCharacteristic extends EventTarget {
      value: DataView | undefined = undefined;
      readonly writeValueWithoutResponse = vi.fn(async (_value: BufferSource): Promise<void> => {});
      readonly startNotifications = vi.fn(
        async (): Promise<BluetoothRemoteGATTCharacteristic> =>
          this as unknown as BluetoothRemoteGATTCharacteristic,
      );
    }

    class FakeService {
      private readonly characteristics = new Map<string, FakeCharacteristic>();

      register(uuid: string, characteristic: FakeCharacteristic): void {
        this.characteristics.set(uuid, characteristic);
      }

      readonly getCharacteristic = vi.fn(
        async (uuid: string): Promise<BluetoothRemoteGATTCharacteristic> => {
          const characteristic = this.characteristics.get(uuid);
          if (!characteristic) throw new Error(`no fake characteristic registered for ${uuid}`);
          return characteristic as unknown as BluetoothRemoteGATTCharacteristic;
        },
      );
    }

    class FakeGattServer {
      connected = false;

      constructor(private readonly service: FakeService) {}

      readonly connect = vi.fn(async (): Promise<BluetoothRemoteGATTServer> => {
        this.connected = true;
        return this as unknown as BluetoothRemoteGATTServer;
      });

      readonly disconnect = vi.fn((): void => {
        this.connected = false;
      });

      readonly getPrimaryService = vi.fn(
        async (_uuid: string): Promise<BluetoothRemoteGATTService> =>
          this.service as unknown as BluetoothRemoteGATTService,
      );
    }

    class FakeDevice extends EventTarget {
      constructor(readonly gatt: FakeGattServer) {
        super();
      }
    }

    class FakeBluetooth extends EventTarget {
      constructor(private readonly device: FakeDevice) {
        super();
      }

      readonly requestDevice = vi.fn(
        async (): Promise<BluetoothDevice> => this.device as unknown as BluetoothDevice,
      );
    }

    let commandCharacteristic: FakeCharacteristic;
    let extractionCharacteristic: FakeCharacteristic;
    let service: FakeService;
    let gattServer: FakeGattServer;
    let device: FakeDevice;
    let bluetooth: FakeBluetooth;
    let connection: BookooMonitorConnection;

    beforeEach(() => {
      commandCharacteristic = new FakeCharacteristic();
      extractionCharacteristic = new FakeCharacteristic();
      service = new FakeService();
      service.register(BOOKOO_MONITOR_COMMAND_CHARACTERISTIC_UUID, commandCharacteristic);
      service.register(BOOKOO_MONITOR_EXTRACTION_CHARACTERISTIC_UUID, extractionCharacteristic);
      gattServer = new FakeGattServer(service);
      device = new FakeDevice(gattServer);
      bluetooth = new FakeBluetooth(device);
      connection = new BookooMonitorConnection(bluetooth as unknown as Bluetooth);
    });

    it("requests a device filtered on the monitor service UUID", async () => {
      await connection.connect();

      expect(bluetooth.requestDevice).toHaveBeenCalledWith({
        filters: [{ services: [BOOKOO_MONITOR_SERVICE_UUID] }],
      });
    });

    it("transitions disconnected -> connecting -> connected while connecting", async () => {
      const states: BookooConnectionState[] = [];
      connection.onStateChange((state) => states.push(state));
      expect(connection.getState()).toBe("disconnected");

      await connection.connect();

      expect(states).toEqual(["connecting", "connected"]);
      expect(connection.getState()).toBe("connected");
    });

    it("throws if a command is sent before connecting", async () => {
      await expect(connection.startExtraction()).rejects.toThrow(
        "Bookoo Espresso Monitor is not connected",
      );
    });

    it("tears down back to disconnected and rethrows when connecting fails", async () => {
      const failure = new Error("user cancelled the device chooser");
      bluetooth.requestDevice.mockRejectedValueOnce(failure);
      const states: BookooConnectionState[] = [];
      connection.onStateChange((state) => states.push(state));

      await expect(connection.connect()).rejects.toThrow(failure);

      expect(states).toEqual(["connecting", "disconnected"]);
      expect(connection.getState()).toBe("disconnected");
    });

    it("disconnects the GATT server when a later connect() step fails after the link is already open", async () => {
      const failure = new Error("service discovery failed");
      gattServer.getPrimaryService.mockRejectedValueOnce(failure);

      await expect(connection.connect()).rejects.toThrow(failure);

      expect(gattServer.connect).toHaveBeenCalled();
      expect(gattServer.disconnect).toHaveBeenCalled();
      expect(connection.getState()).toBe("disconnected");
    });

    it("rejects a second connect() while already connecting or connected", async () => {
      const connectPromise = connection.connect();

      await expect(connection.connect()).rejects.toThrow(
        "Bookoo Espresso Monitor is already connecting or connected",
      );

      await connectPromise;
      await expect(connection.connect()).rejects.toThrow(
        "Bookoo Espresso Monitor is already connecting or connected",
      );
    });

    it("sends the start-extraction command", async () => {
      await connection.connect();
      await connection.startExtraction();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        MONITOR_START_EXTRACTION_COMMAND,
      );
    });

    it("sends the stop-extraction command", async () => {
      await connection.connect();
      await connection.stopExtraction();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        MONITOR_STOP_EXTRACTION_COMMAND,
      );
    });

    it("notifies onReading listeners with the decoded reading from an extraction notification", async () => {
      await connection.connect();

      const readings: IBookooMonitorReading[] = [];
      connection.onReading((reading) => readings.push(reading));

      extractionCharacteristic.value = toDataView(withChecksum(VALID_EXTRACTION_PACKET_BYTES));
      extractionCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      expect(readings).toEqual<IBookooMonitorReading[]>([
        { pressureBar: 9.32, batteryPercent: 90 },
      ]);
    });

    it("ignores an undecodable extraction notification", async () => {
      await connection.connect();

      const readings: IBookooMonitorReading[] = [];
      connection.onReading((reading) => readings.push(reading));

      const badBytes = withChecksum(VALID_EXTRACTION_PACKET_BYTES);
      badBytes[badBytes.length - 1] ^= 0xff;
      extractionCharacteristic.value = toDataView(badBytes);
      extractionCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      expect(readings).toEqual([]);
    });

    it("moves back to disconnected and disconnects the GATT server on disconnect()", async () => {
      await connection.connect();
      const states: BookooConnectionState[] = [];
      connection.onStateChange((state) => states.push(state));

      connection.disconnect();

      expect(gattServer.disconnect).toHaveBeenCalled();
      expect(states).toEqual(["disconnected"]);
      expect(connection.getState()).toBe("disconnected");
    });

    it("moves back to disconnected when the device fires gattserverdisconnected", async () => {
      await connection.connect();

      device.dispatchEvent(new Event("gattserverdisconnected"));

      expect(connection.getState()).toBe("disconnected");
      await expect(connection.startExtraction()).rejects.toThrow(
        "Bookoo Espresso Monitor is not connected",
      );
    });
  });
});
