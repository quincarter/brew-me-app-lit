/// <reference types="web-bluetooth" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOOKOO_SCALE_COMMAND_CHARACTERISTIC_UUID,
  BOOKOO_SCALE_SERVICE_UUID,
  BOOKOO_SCALE_WEIGHT_CHARACTERISTIC_UUID,
  BookooScaleConnection,
  SCALE_RESET_TIMER_COMMAND,
  SCALE_STOP_TIMER_COMMAND,
  SCALE_TARE_AND_START_TIMER_COMMAND,
  decodeScaleWeightPacket,
} from "../bookoo-scale";
import type {
  BookooConnectionState,
  IBookooScaleReading,
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
 * A valid 20-byte weight packet: timeMs = 300, weightGrams = 24.50, flowRateGramsPerSecond = 1.25,
 * batteryPercent = 85. Checksum byte (last) is a placeholder, always overwritten by `withChecksum`.
 */
const VALID_WEIGHT_PACKET_BYTES = [
  0x03, // BYTE1 - product number (unused by the decoder)
  0x0b, // BYTE2 - packet type (weight)
  0x00,
  0x01,
  0x2c, // BYTE3-5 - timeMs = 300
  0x67, // BYTE6 - unit marker (unused by the decoder)
  0x00, // BYTE7 - weight sign (positive)
  0x00,
  0x09,
  0x92, // BYTE8-10 - weight magnitude = 2450 -> 24.50g
  0x00, // BYTE11 - flow sign (positive)
  0x00,
  0x7d, // BYTE12-13 - flow magnitude = 125 -> 1.25 g/s
  0x55, // BYTE14 - battery = 85
  0x00,
  0x00,
  0x00,
  0x00,
  0x00, // BYTE15-19 - reserved
  0x00, // BYTE20 - checksum placeholder
];

describe("bookoo-scale", () => {
  describe("decodeScaleWeightPacket", () => {
    it("decodes a valid packet", () => {
      const data = toDataView(withChecksum(VALID_WEIGHT_PACKET_BYTES));

      expect(decodeScaleWeightPacket(data)).toEqual<IBookooScaleReading>({
        timeMs: 300,
        weightGrams: 24.5,
        flowRateGramsPerSecond: 1.25,
        batteryPercent: 85,
      });
    });

    it("decodes a negative weight when the weight sign byte is 0x2D", () => {
      const bytes = [...VALID_WEIGHT_PACKET_BYTES];
      bytes[6] = 0x2d;
      const reading = decodeScaleWeightPacket(toDataView(withChecksum(bytes)));

      expect(reading?.weightGrams).toBe(-24.5);
      expect(reading?.flowRateGramsPerSecond).toBe(1.25);
    });

    it("decodes a negative flow rate when the flow sign byte is 0x2D", () => {
      const bytes = [...VALID_WEIGHT_PACKET_BYTES];
      bytes[10] = 0x2d;
      const reading = decodeScaleWeightPacket(toDataView(withChecksum(bytes)));

      expect(reading?.weightGrams).toBe(24.5);
      expect(reading?.flowRateGramsPerSecond).toBe(-1.25);
    });

    it("decodes both a negative weight and a negative flow rate together", () => {
      const bytes = [...VALID_WEIGHT_PACKET_BYTES];
      bytes[6] = 0x2d;
      bytes[10] = 0x2d;
      const reading = decodeScaleWeightPacket(toDataView(withChecksum(bytes)));

      expect(reading?.weightGrams).toBe(-24.5);
      expect(reading?.flowRateGramsPerSecond).toBe(-1.25);
    });

    it("returns null when the checksum byte doesn't match", () => {
      const bytes = withChecksum(VALID_WEIGHT_PACKET_BYTES);
      bytes[bytes.length - 1] ^= 0xff;

      expect(decodeScaleWeightPacket(toDataView(bytes))).toBeNull();
    });

    it("returns null when the packet type byte isn't 0x0B", () => {
      const bytes = [...VALID_WEIGHT_PACKET_BYTES];
      bytes[1] = 0x0c;

      expect(decodeScaleWeightPacket(toDataView(withChecksum(bytes)))).toBeNull();
    });

    it("returns null for a packet shorter than 20 bytes", () => {
      const shortPacket = toDataView(withChecksum(VALID_WEIGHT_PACKET_BYTES.slice(0, 19)));

      expect(decodeScaleWeightPacket(shortPacket)).toBeNull();
      expect(decodeScaleWeightPacket(toDataView(new Uint8Array(0)))).toBeNull();
    });
  });

  describe("command byte constants", () => {
    it("matches the documented tare-and-start-timer command", () => {
      expect([...SCALE_TARE_AND_START_TIMER_COMMAND]).toEqual([0x03, 0x0a, 0x07, 0x00, 0x00, 0x0e]);
    });

    it("matches the documented stop-timer command", () => {
      expect([...SCALE_STOP_TIMER_COMMAND]).toEqual([0x03, 0x0a, 0x05, 0x00, 0x00, 0x0c]);
    });

    it("matches the documented reset-timer command", () => {
      expect([...SCALE_RESET_TIMER_COMMAND]).toEqual([0x03, 0x0a, 0x06, 0x00, 0x00, 0x0f]);
    });
  });

  describe("BookooScaleConnection", () => {
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
    let weightCharacteristic: FakeCharacteristic;
    let service: FakeService;
    let gattServer: FakeGattServer;
    let device: FakeDevice;
    let bluetooth: FakeBluetooth;
    let connection: BookooScaleConnection;

    beforeEach(() => {
      commandCharacteristic = new FakeCharacteristic();
      weightCharacteristic = new FakeCharacteristic();
      service = new FakeService();
      service.register(BOOKOO_SCALE_COMMAND_CHARACTERISTIC_UUID, commandCharacteristic);
      service.register(BOOKOO_SCALE_WEIGHT_CHARACTERISTIC_UUID, weightCharacteristic);
      gattServer = new FakeGattServer(service);
      device = new FakeDevice(gattServer);
      bluetooth = new FakeBluetooth(device);
      connection = new BookooScaleConnection(bluetooth as unknown as Bluetooth);
    });

    it("requests a device filtered on the scale service UUID", async () => {
      await connection.connect();

      expect(bluetooth.requestDevice).toHaveBeenCalledWith({
        filters: [{ services: [BOOKOO_SCALE_SERVICE_UUID] }],
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
      await expect(connection.tareAndStartTimer()).rejects.toThrow("Bookoo Scale is not connected");
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
        "Bookoo Scale is already connecting or connected",
      );

      await connectPromise;
      await expect(connection.connect()).rejects.toThrow(
        "Bookoo Scale is already connecting or connected",
      );
    });

    it("sends the tare-and-start-timer command", async () => {
      await connection.connect();
      await connection.tareAndStartTimer();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        SCALE_TARE_AND_START_TIMER_COMMAND,
      );
    });

    it("sends the stop-timer command", async () => {
      await connection.connect();
      await connection.stopTimer();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        SCALE_STOP_TIMER_COMMAND,
      );
    });

    it("sends the reset-timer command", async () => {
      await connection.connect();
      await connection.resetTimer();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        SCALE_RESET_TIMER_COMMAND,
      );
    });

    it("notifies onReading listeners with the decoded reading from a weight notification", async () => {
      await connection.connect();

      const readings: IBookooScaleReading[] = [];
      connection.onReading((reading) => readings.push(reading));

      weightCharacteristic.value = toDataView(withChecksum(VALID_WEIGHT_PACKET_BYTES));
      weightCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      expect(readings).toEqual<IBookooScaleReading[]>([
        { timeMs: 300, weightGrams: 24.5, flowRateGramsPerSecond: 1.25, batteryPercent: 85 },
      ]);
    });

    it("ignores an undecodable weight notification", async () => {
      await connection.connect();

      const readings: IBookooScaleReading[] = [];
      connection.onReading((reading) => readings.push(reading));

      const badBytes = withChecksum(VALID_WEIGHT_PACKET_BYTES);
      badBytes[badBytes.length - 1] ^= 0xff;
      weightCharacteristic.value = toDataView(badBytes);
      weightCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

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
      await expect(connection.tareAndStartTimer()).rejects.toThrow("Bookoo Scale is not connected");
    });
  });
});
