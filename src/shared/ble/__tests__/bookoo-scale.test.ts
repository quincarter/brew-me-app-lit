/// <reference types="web-bluetooth" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOOKOO_SCALE_COMMAND_CHARACTERISTIC_UUID,
  BOOKOO_SCALE_SERVICE_UUID,
  BOOKOO_SCALE_WEIGHT_CHARACTERISTIC_UUID,
  BookooScaleConnection,
  SCALE_CALIBRATE_COMMAND,
  SCALE_RESET_AUTO_SHUTDOWN_COMMAND,
  SCALE_RESET_TIMER_COMMAND,
  SCALE_SHUTDOWN_COMMAND,
  SCALE_START_TIMER_COMMAND,
  SCALE_STOP_TIMER_COMMAND,
  SCALE_TARE_AND_START_TIMER_COMMAND,
  SCALE_TARE_COMMAND,
  buildSetAutoOffDurationMinutesCommand,
  buildSetAutomaticStopConditionCommand,
  buildSetBeepVolumeCommand,
  buildSetFlowSmoothingCommand,
  buildSetPowderWeightCommand,
  decodeScaleAutomaticModeEventPacket,
  decodeScalePowderWeightPacket,
  decodeScaleWeightPacket,
} from "../bookoo-scale";
import type {
  BookooConnectionState,
  IBookooScaleAutomaticModeEvent,
  IBookooScalePowderWeightReading,
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

/**
 * A valid 20-byte powder-weight packet: powderWeightGrams = 18.50. Checksum byte (last) is a
 * placeholder, always overwritten by `withChecksum`.
 */
const VALID_POWDER_WEIGHT_PACKET_BYTES = [
  0x03, // BYTE1 - product number (unused by the decoder)
  0x0f, // BYTE2 - packet type (powder weight)
  0x00, // BYTE3 - powder weight sign (positive)
  0x00,
  0x07,
  0x3a, // BYTE4-6 - powder weight magnitude = 1850 -> 18.50g
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00, // BYTE7-19 - reserved
  0x00, // BYTE20 - checksum placeholder
];

/**
 * A valid 20-byte automatic-mode event packet: eventType = "started", timeMs = 5000,
 * weightGrams = 24.50, result = 2.15. Checksum byte (last) is a placeholder, always overwritten
 * by `withChecksum`.
 */
const VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES = [
  0x03, // BYTE1 - product number (unused by the decoder)
  0x0d, // BYTE2 - packet type (automatic mode event)
  0x01, // BYTE3 - event type (started)
  0x00,
  0x13,
  0x88, // BYTE4-6 - timeMs = 5000
  0x00, // BYTE7 - weight sign (positive)
  0x00,
  0x09,
  0x92, // BYTE8-10 - weight magnitude = 2450 -> 24.50g
  0x00, // BYTE11 - result sign (positive)
  0x00,
  0xd7, // BYTE12-13 - result magnitude = 215 -> 2.15
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00, // BYTE14-19 - reserved
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

  describe("decodeScalePowderWeightPacket", () => {
    it("decodes a valid packet", () => {
      const data = toDataView(withChecksum(VALID_POWDER_WEIGHT_PACKET_BYTES));

      expect(decodeScalePowderWeightPacket(data)).toEqual<IBookooScalePowderWeightReading>({
        powderWeightGrams: 18.5,
      });
    });

    it("decodes a negative powder weight when the sign byte is 0x2D", () => {
      const bytes = [...VALID_POWDER_WEIGHT_PACKET_BYTES];
      bytes[2] = 0x2d;
      const reading = decodeScalePowderWeightPacket(toDataView(withChecksum(bytes)));

      expect(reading?.powderWeightGrams).toBe(-18.5);
    });

    it("returns null when the checksum byte doesn't match", () => {
      const bytes = withChecksum(VALID_POWDER_WEIGHT_PACKET_BYTES);
      bytes[bytes.length - 1] ^= 0xff;

      expect(decodeScalePowderWeightPacket(toDataView(bytes))).toBeNull();
    });

    it("returns null when the packet type byte isn't 0x0F", () => {
      const bytes = [...VALID_POWDER_WEIGHT_PACKET_BYTES];
      bytes[1] = 0x0b;

      expect(decodeScalePowderWeightPacket(toDataView(withChecksum(bytes)))).toBeNull();
    });

    it("returns null for a packet shorter than 20 bytes", () => {
      const shortPacket = toDataView(withChecksum(VALID_POWDER_WEIGHT_PACKET_BYTES.slice(0, 19)));

      expect(decodeScalePowderWeightPacket(shortPacket)).toBeNull();
      expect(decodeScalePowderWeightPacket(toDataView(new Uint8Array(0)))).toBeNull();
    });
  });

  describe("decodeScaleAutomaticModeEventPacket", () => {
    it("decodes a valid 'started' packet with every field populated", () => {
      const data = toDataView(withChecksum(VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES));

      expect(decodeScaleAutomaticModeEventPacket(data)).toEqual<IBookooScaleAutomaticModeEvent>({
        eventType: "started",
        timeMs: 5000,
        weightGrams: 24.5,
        result: 2.15,
      });
    });

    it.each([
      [0x00, "stopped"],
      [0x01, "started"],
      [0x02, "ready"],
      [0x03, "exitReady"],
      [0x04, "exitDone"],
    ] as const)("decodes event byte 0x%s as eventType %s", (eventByte, eventType) => {
      const bytes = [...VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES];
      bytes[2] = eventByte;
      const event = decodeScaleAutomaticModeEventPacket(toDataView(withChecksum(bytes)));

      expect(event?.eventType).toBe(eventType);
    });

    it("decodes a negative weight when the weight sign byte is 0x2D", () => {
      const bytes = [...VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES];
      bytes[6] = 0x2d;
      const event = decodeScaleAutomaticModeEventPacket(toDataView(withChecksum(bytes)));

      expect(event?.weightGrams).toBe(-24.5);
      expect(event?.result).toBe(2.15);
    });

    it("decodes a negative result when the result sign byte is 0x2D", () => {
      const bytes = [...VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES];
      bytes[10] = 0x2d;
      const event = decodeScaleAutomaticModeEventPacket(toDataView(withChecksum(bytes)));

      expect(event?.weightGrams).toBe(24.5);
      expect(event?.result).toBe(-2.15);
    });

    it("returns null when the checksum byte doesn't match", () => {
      const bytes = withChecksum(VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES);
      bytes[bytes.length - 1] ^= 0xff;

      expect(decodeScaleAutomaticModeEventPacket(toDataView(bytes))).toBeNull();
    });

    it("returns null when the packet type byte isn't 0x0D", () => {
      const bytes = [...VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES];
      bytes[1] = 0x0f;

      expect(decodeScaleAutomaticModeEventPacket(toDataView(withChecksum(bytes)))).toBeNull();
    });

    it("returns null for an unrecognized event byte", () => {
      const bytes = [...VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES];
      bytes[2] = 0x05;

      expect(decodeScaleAutomaticModeEventPacket(toDataView(withChecksum(bytes)))).toBeNull();
    });

    it("returns null for a packet shorter than 20 bytes", () => {
      const shortPacket = toDataView(
        withChecksum(VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES.slice(0, 19)),
      );

      expect(decodeScaleAutomaticModeEventPacket(shortPacket)).toBeNull();
      expect(decodeScaleAutomaticModeEventPacket(toDataView(new Uint8Array(0)))).toBeNull();
    });
  });

  describe("command byte constants", () => {
    it("matches the documented tare command", () => {
      expect([...SCALE_TARE_COMMAND]).toEqual([0x03, 0x0a, 0x01, 0x00, 0x00, 0x08]);
    });

    it("matches the documented start-timer command", () => {
      expect([...SCALE_START_TIMER_COMMAND]).toEqual([0x03, 0x0a, 0x04, 0x00, 0x00, 0x0d]);
    });

    it("matches the documented tare-and-start-timer command", () => {
      expect([...SCALE_TARE_AND_START_TIMER_COMMAND]).toEqual([0x03, 0x0a, 0x07, 0x00, 0x00, 0x0e]);
    });

    it("matches the documented stop-timer command", () => {
      expect([...SCALE_STOP_TIMER_COMMAND]).toEqual([0x03, 0x0a, 0x05, 0x00, 0x00, 0x0c]);
    });

    it("matches the documented reset-timer command", () => {
      expect([...SCALE_RESET_TIMER_COMMAND]).toEqual([0x03, 0x0a, 0x06, 0x00, 0x00, 0x0f]);
    });

    it("matches the documented calibrate command", () => {
      expect([...SCALE_CALIBRATE_COMMAND]).toEqual([0x03, 0x0a, 0x09, 0x00, 0x00, 0x00]);
    });

    it("matches the documented shutdown command", () => {
      expect([...SCALE_SHUTDOWN_COMMAND]).toEqual([0x03, 0x0a, 0x15, 0x00, 0x00, 0x1c]);
    });

    it("matches the documented reset-auto-shutdown command", () => {
      expect([...SCALE_RESET_AUTO_SHUTDOWN_COMMAND]).toEqual([0x03, 0x0a, 0x25, 0x00, 0x00, 0x2c]);
    });
  });

  describe("buildSetBeepVolumeCommand", () => {
    it("encodes beep level 0 (muted)", () => {
      expect([...buildSetBeepVolumeCommand(0)]).toEqual([0x03, 0x0a, 0x02, 0x00, 0x00, 0x0b]);
    });

    it("encodes beep level 3 (high)", () => {
      expect([...buildSetBeepVolumeCommand(3)]).toEqual([0x03, 0x0a, 0x02, 0x00, 0x03, 0x08]);
    });
  });

  describe("buildSetAutoOffDurationMinutesCommand", () => {
    it("encodes the minimum 5-minute duration", () => {
      expect([...buildSetAutoOffDurationMinutesCommand(5)]).toEqual([
        0x03, 0x0a, 0x03, 0x00, 0x05, 0x0f,
      ]);
    });

    it("encodes the maximum 30-minute duration", () => {
      expect([...buildSetAutoOffDurationMinutesCommand(30)]).toEqual([
        0x03, 0x0a, 0x03, 0x00, 0x1e, 0x14,
      ]);
    });
  });

  describe("buildSetFlowSmoothingCommand", () => {
    it("encodes enabled", () => {
      expect([...buildSetFlowSmoothingCommand(true)]).toEqual([0x03, 0x0a, 0x08, 0x01, 0x00, 0x00]);
    });

    it("encodes disabled", () => {
      expect([...buildSetFlowSmoothingCommand(false)]).toEqual([0x03, 0x0a, 0x08, 0x00, 0x00, 0x01]);
    });
  });

  describe("buildSetPowderWeightCommand", () => {
    it("encodes 24.5g as a big-endian 16-bit value (245)", () => {
      expect([...buildSetPowderWeightCommand(24.5)]).toEqual([
        0x03, 0x0a, 0x0d, 0x00, 0xf5, 0xf1,
      ]);
    });

    it("rounds to the nearest tenth of a gram", () => {
      expect([...buildSetPowderWeightCommand(18.52)]).toEqual([
        0x03, 0x0a, 0x0d, 0x00, 0xb9, 0xbd,
      ]);
    });
  });

  describe("buildSetAutomaticStopConditionCommand", () => {
    it("encodes timing mode with the flow-stopped condition", () => {
      expect([...buildSetAutomaticStopConditionCommand("timing", "flowStopped")]).toEqual([
        0x03, 0x0a, 0x0b, 0x01, 0x00, 0x03,
      ]);
    });

    it("encodes ratio mode with the filter-removed condition", () => {
      expect([...buildSetAutomaticStopConditionCommand("ratio", "filterRemoved")]).toEqual([
        0x03, 0x0a, 0x0b, 0x02, 0x01, 0x01,
      ]);
    });

    it("encodes ratio mode with the server-removed condition", () => {
      expect([...buildSetAutomaticStopConditionCommand("ratio", "serverRemoved")]).toEqual([
        0x03, 0x0a, 0x0b, 0x02, 0x02, 0x02,
      ]);
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

    it("sends the start-timer command", async () => {
      await connection.connect();
      await connection.startTimer();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        SCALE_START_TIMER_COMMAND,
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

    it("sends the tare command", async () => {
      await connection.connect();
      await connection.tare();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        SCALE_TARE_COMMAND,
      );
    });

    it("sends the calibrate command", async () => {
      await connection.connect();
      await connection.calibrate();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        SCALE_CALIBRATE_COMMAND,
      );
    });

    it("sends the shutdown command", async () => {
      await connection.connect();
      await connection.shutdown();

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        SCALE_SHUTDOWN_COMMAND,
      );
    });

    it("throws if tare/calibrate/shutdown is sent before connecting", async () => {
      await expect(connection.tare()).rejects.toThrow("Bookoo Scale is not connected");
      await expect(connection.calibrate()).rejects.toThrow("Bookoo Scale is not connected");
      await expect(connection.shutdown()).rejects.toThrow("Bookoo Scale is not connected");
    });

    it("sends the set-beep-volume command with the encoded level", async () => {
      await connection.connect();
      await connection.setBeepVolume(2);

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        Uint8Array.of(0x03, 0x0a, 0x02, 0x00, 0x02, 0x09),
      );
    });

    it("sends the set-auto-off-duration command with the encoded minutes", async () => {
      await connection.connect();
      await connection.setAutoOffDurationMinutes(10);

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        Uint8Array.of(0x03, 0x0a, 0x03, 0x00, 0x0a, 0x00),
      );
    });

    it("sends the set-flow-smoothing command with the encoded enabled flag", async () => {
      await connection.connect();
      await connection.setFlowSmoothing(true);

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        Uint8Array.of(0x03, 0x0a, 0x08, 0x01, 0x00, 0x00),
      );
    });

    it("sends the set-powder-weight command with the encoded grams", async () => {
      await connection.connect();
      await connection.setPowderWeight(18.5);

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        Uint8Array.of(0x03, 0x0a, 0x0d, 0x00, 0xb9, 0xbd),
      );
    });

    it("sends the set-automatic-stop-condition command with the encoded mode and condition", async () => {
      await connection.connect();
      await connection.setAutomaticStopCondition("ratio", "filterRemoved");

      expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
        Uint8Array.of(0x03, 0x0a, 0x0b, 0x02, 0x01, 0x01),
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

    it("ignores a notification with an unrecognized packet type", async () => {
      await connection.connect();

      const weightReadings: IBookooScaleReading[] = [];
      const powderReadings: IBookooScalePowderWeightReading[] = [];
      const modeEvents: IBookooScaleAutomaticModeEvent[] = [];
      connection.onReading((reading) => weightReadings.push(reading));
      connection.onPowderWeightReading((reading) => powderReadings.push(reading));
      connection.onAutomaticModeEvent((event) => modeEvents.push(event));

      const bytes = [...VALID_WEIGHT_PACKET_BYTES];
      bytes[1] = 0xff;
      weightCharacteristic.value = toDataView(withChecksum(bytes));
      weightCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      expect(weightReadings).toEqual([]);
      expect(powderReadings).toEqual([]);
      expect(modeEvents).toEqual([]);
    });

    it("notifies onPowderWeightReading listeners with the decoded reading from a powder-weight notification", async () => {
      await connection.connect();

      const readings: IBookooScalePowderWeightReading[] = [];
      connection.onPowderWeightReading((reading) => readings.push(reading));

      weightCharacteristic.value = toDataView(withChecksum(VALID_POWDER_WEIGHT_PACKET_BYTES));
      weightCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      expect(readings).toEqual<IBookooScalePowderWeightReading[]>([{ powderWeightGrams: 18.5 }]);
    });

    it("notifies onAutomaticModeEvent listeners with the decoded event from an automatic-mode-event notification", async () => {
      await connection.connect();

      const events: IBookooScaleAutomaticModeEvent[] = [];
      connection.onAutomaticModeEvent((event) => events.push(event));

      weightCharacteristic.value = toDataView(
        withChecksum(VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES),
      );
      weightCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      expect(events).toEqual<IBookooScaleAutomaticModeEvent[]>([
        { eventType: "started", timeMs: 5000, weightGrams: 24.5, result: 2.15 },
      ]);
    });

    it("does not route a weight-type notification to the powder-weight or automatic-mode-event listeners", async () => {
      await connection.connect();

      const readings: IBookooScalePowderWeightReading[] = [];
      const events: IBookooScaleAutomaticModeEvent[] = [];
      connection.onPowderWeightReading((reading) => readings.push(reading));
      connection.onAutomaticModeEvent((event) => events.push(event));

      weightCharacteristic.value = toDataView(withChecksum(VALID_WEIGHT_PACKET_BYTES));
      weightCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      expect(readings).toEqual([]);
      expect(events).toEqual([]);
    });

    it("does not route a powder-weight or automatic-mode-event notification to the plain reading listeners", async () => {
      await connection.connect();

      const readings: IBookooScaleReading[] = [];
      connection.onReading((reading) => readings.push(reading));

      weightCharacteristic.value = toDataView(withChecksum(VALID_POWDER_WEIGHT_PACKET_BYTES));
      weightCharacteristic.dispatchEvent(new Event("characteristicvaluechanged"));

      weightCharacteristic.value = toDataView(
        withChecksum(VALID_AUTOMATIC_MODE_EVENT_PACKET_BYTES),
      );
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

    describe("keep-awake interval", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("sends no keep-awake write before the first interval tick", async () => {
        await connection.connect();

        expect(commandCharacteristic.writeValueWithoutResponse).not.toHaveBeenCalled();
      });

      it("sends a reset-auto-shutdown write after each 60-second interval, and stops after disconnect()", async () => {
        await connection.connect();

        await vi.advanceTimersByTimeAsync(60_000);
        expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledTimes(1);
        expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledWith(
          SCALE_RESET_AUTO_SHUTDOWN_COMMAND,
        );

        await vi.advanceTimersByTimeAsync(60_000);
        expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledTimes(2);

        connection.disconnect();

        await vi.advanceTimersByTimeAsync(120_000);
        expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledTimes(2);
      });

      it("keeps running on the next tick even if a keep-awake write rejects", async () => {
        await connection.connect();
        commandCharacteristic.writeValueWithoutResponse.mockRejectedValueOnce(
          new Error("write failed"),
        );

        await vi.advanceTimersByTimeAsync(60_000);
        expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledTimes(1);
        expect(connection.getState()).toBe("connected");

        await vi.advanceTimersByTimeAsync(60_000);
        expect(commandCharacteristic.writeValueWithoutResponse).toHaveBeenCalledTimes(2);
        expect(connection.getState()).toBe("connected");
      });
    });
  });
});
