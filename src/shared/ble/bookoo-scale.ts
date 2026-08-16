/// <reference types="web-bluetooth" />
import type {
  BookooConnectionState,
  IBookooScaleReading,
} from "../interfaces/bookoo-ble.interface";

export const BOOKOO_SCALE_SERVICE_UUID = "00000ffe-0000-1000-8000-00805f9b34fb";
export const BOOKOO_SCALE_COMMAND_CHARACTERISTIC_UUID = "0000ff12-0000-1000-8000-00805f9b34fb";
export const BOOKOO_SCALE_WEIGHT_CHARACTERISTIC_UUID = "0000ff11-0000-1000-8000-00805f9b34fb";

/** Last byte of each command is the documented XOR checksum of the bytes before it. */
export const SCALE_TARE_AND_START_TIMER_COMMAND: Uint8Array<ArrayBuffer> = Uint8Array.of(
  0x03,
  0x0a,
  0x07,
  0x00,
  0x00,
  0x0e,
);
export const SCALE_STOP_TIMER_COMMAND: Uint8Array<ArrayBuffer> = Uint8Array.of(
  0x03,
  0x0a,
  0x05,
  0x00,
  0x00,
  0x0c,
);
export const SCALE_RESET_TIMER_COMMAND: Uint8Array<ArrayBuffer> = Uint8Array.of(
  0x03,
  0x0a,
  0x06,
  0x00,
  0x00,
  0x0f,
);

const WEIGHT_PACKET_TYPE = 0x0b;
/** BYTE1-BYTE20 per the Bookoo Scale protocol; BYTE20 is the checksum. */
const WEIGHT_PACKET_LENGTH = 20;
/** ASCII '-' - the documented sign byte for a negative weight/flow reading. Any other value means positive. */
const NEGATIVE_SIGN_BYTE = 0x2d;

/**
 * Decodes a Bookoo Scale weight-data notification (characteristic `0xFF11`, packet type `0x0B`).
 * Returns null for a too-short, wrong-type, or checksum-failed packet.
 */
export const decodeScaleWeightPacket = (data: DataView): IBookooScaleReading | null => {
  if (data.byteLength < WEIGHT_PACKET_LENGTH) return null;
  if (data.getUint8(1) !== WEIGHT_PACKET_TYPE) return null;

  let checksum = 0;
  for (let i = 0; i < WEIGHT_PACKET_LENGTH - 1; i++) checksum ^= data.getUint8(i);
  if (checksum !== data.getUint8(WEIGHT_PACKET_LENGTH - 1)) return null;

  const timeMs = (data.getUint8(2) << 16) | (data.getUint8(3) << 8) | data.getUint8(4);

  const weightMagnitude =
    ((data.getUint8(7) << 16) | (data.getUint8(8) << 8) | data.getUint8(9)) / 100;
  const weightGrams = data.getUint8(6) === NEGATIVE_SIGN_BYTE ? -weightMagnitude : weightMagnitude;

  const flowMagnitude = ((data.getUint8(11) << 8) | data.getUint8(12)) / 100;
  const flowRateGramsPerSecond =
    data.getUint8(10) === NEGATIVE_SIGN_BYTE ? -flowMagnitude : flowMagnitude;

  const batteryPercent = data.getUint8(13);

  return { timeMs, weightGrams, flowRateGramsPerSecond, batteryPercent };
};

/**
 * Web Bluetooth connection to a Bookoo Scale (Mini/Ultra). Pairing, GATT I/O, and notification
 * subscription all require the main thread - Web Bluetooth isn't exposed to workers in any
 * shipping browser - so this owns the live connection directly rather than proxying through one.
 * `decodeScaleWeightPacket` above stays a pure function so it can still be reused off-thread later.
 */
export class BookooScaleConnection {
  private readonly bluetooth: Bluetooth;
  private device: BluetoothDevice | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private weightCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private state: BookooConnectionState = "disconnected";
  private readonly readingListeners = new Set<(reading: IBookooScaleReading) => void>();
  private readonly stateListeners = new Set<(state: BookooConnectionState) => void>();

  constructor(bluetooth?: Bluetooth) {
    this.bluetooth = bluetooth ?? navigator.bluetooth;
  }

  getState(): BookooConnectionState {
    return this.state;
  }

  onReading(listener: (reading: IBookooScaleReading) => void): () => void {
    this.readingListeners.add(listener);
    return () => this.readingListeners.delete(listener);
  }

  onStateChange(listener: (state: BookooConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  async connect(): Promise<void> {
    if (this.state !== "disconnected") {
      throw new Error("Bookoo Scale is already connecting or connected");
    }
    this.setState("connecting");
    try {
      const device = await this.bluetooth.requestDevice({
        filters: [{ services: [BOOKOO_SCALE_SERVICE_UUID] }],
      });
      device.addEventListener("gattserverdisconnected", this.handleGattDisconnected);
      this.device = device;

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Bookoo Scale GATT server is unavailable");

      const service = await server.getPrimaryService(BOOKOO_SCALE_SERVICE_UUID);
      this.commandCharacteristic = await service.getCharacteristic(
        BOOKOO_SCALE_COMMAND_CHARACTERISTIC_UUID,
      );
      this.weightCharacteristic = await service.getCharacteristic(
        BOOKOO_SCALE_WEIGHT_CHARACTERISTIC_UUID,
      );

      this.weightCharacteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleWeightNotification,
      );
      await this.weightCharacteristic.startNotifications();

      this.setState("connected");
    } catch (error) {
      this.teardown();
      throw error;
    }
  }

  disconnect(): void {
    this.teardown();
  }

  async tareAndStartTimer(): Promise<void> {
    await this.sendCommand(SCALE_TARE_AND_START_TIMER_COMMAND);
  }

  async stopTimer(): Promise<void> {
    await this.sendCommand(SCALE_STOP_TIMER_COMMAND);
  }

  async resetTimer(): Promise<void> {
    await this.sendCommand(SCALE_RESET_TIMER_COMMAND);
  }

  private async sendCommand(command: Uint8Array<ArrayBuffer>): Promise<void> {
    if (!this.commandCharacteristic) throw new Error("Bookoo Scale is not connected");
    await this.commandCharacteristic.writeValueWithoutResponse(command);
  }

  private readonly handleWeightNotification = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (!data) return;

    const reading = decodeScaleWeightPacket(data);
    if (!reading) return;

    for (const listener of this.readingListeners) listener(reading);
  };

  private readonly handleGattDisconnected = (): void => {
    this.teardown();
  };

  private teardown(): void {
    this.weightCharacteristic?.removeEventListener(
      "characteristicvaluechanged",
      this.handleWeightNotification,
    );
    this.device?.removeEventListener("gattserverdisconnected", this.handleGattDisconnected);
    this.device?.gatt?.disconnect();
    this.device = null;
    this.commandCharacteristic = null;
    this.weightCharacteristic = null;
    this.setState("disconnected");
  }

  private setState(state: BookooConnectionState): void {
    this.state = state;
    for (const listener of this.stateListeners) listener(state);
  }
}
