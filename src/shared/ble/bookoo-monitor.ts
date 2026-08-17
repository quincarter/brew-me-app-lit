/// <reference types="web-bluetooth" />
import type {
  BookooConnectionState,
  IBookooMonitorReading,
} from "../interfaces/bookoo-ble.interface";

export const BOOKOO_MONITOR_SERVICE_UUID = "00000fff-0000-1000-8000-00805f9b34fb";
export const BOOKOO_MONITOR_COMMAND_CHARACTERISTIC_UUID = "0000ff01-0000-1000-8000-00805f9b34fb";
export const BOOKOO_MONITOR_EXTRACTION_CHARACTERISTIC_UUID = "0000ff02-0000-1000-8000-00805f9b34fb";

/** Last byte of each command is the documented XOR checksum of the bytes before it. */
export const MONITOR_START_EXTRACTION_COMMAND: Uint8Array<ArrayBuffer> = Uint8Array.of(
  0x02,
  0x0c,
  0x01,
  0x00,
  0x00,
  0x00,
  0x0f,
);
export const MONITOR_STOP_EXTRACTION_COMMAND: Uint8Array<ArrayBuffer> = Uint8Array.of(
  0x02,
  0x0c,
  0x00,
  0x00,
  0x00,
  0x00,
  0x0e,
);

const EXTRACTION_PACKET_TYPE = 0x1b;
/** BYTE1-BYTE10 per the Espresso Monitor protocol; BYTE10 is the checksum. */
const EXTRACTION_PACKET_LENGTH = 10;

/**
 * Decodes a Bookoo Espresso Monitor extraction-data notification (characteristic `0xFF02`,
 * packet type `0x1B`). Returns null for a too-short, wrong-type, or checksum-failed packet.
 */
export const decodeMonitorPressurePacket = (data: DataView): IBookooMonitorReading | null => {
  if (data.byteLength < EXTRACTION_PACKET_LENGTH) return null;
  if (data.getUint8(1) !== EXTRACTION_PACKET_TYPE) return null;

  let checksum = 0;
  for (let i = 0; i < EXTRACTION_PACKET_LENGTH - 1; i++) checksum ^= data.getUint8(i);
  if (checksum !== data.getUint8(EXTRACTION_PACKET_LENGTH - 1)) return null;

  const pressureBar = ((data.getUint8(4) << 8) | data.getUint8(5)) / 100;
  const batteryPercent = data.getUint8(6);

  return { pressureBar, batteryPercent };
};

/**
 * Web Bluetooth connection to a Bookoo Espresso Monitor. Pairing, GATT I/O, and notification
 * subscription all require the main thread - Web Bluetooth isn't exposed to workers in any
 * shipping browser - so this owns the live connection directly rather than proxying through one.
 * `decodeMonitorPressurePacket` above stays a pure function so it can still be reused off-thread later.
 */
export class BookooMonitorConnection {
  private readonly bluetooth: Bluetooth;
  private device: BluetoothDevice | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private extractionCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private state: BookooConnectionState = "disconnected";
  private readonly readingListeners = new Set<(reading: IBookooMonitorReading) => void>();
  private readonly stateListeners = new Set<(state: BookooConnectionState) => void>();

  constructor(bluetooth?: Bluetooth) {
    this.bluetooth = bluetooth ?? navigator.bluetooth;
  }

  getState(): BookooConnectionState {
    return this.state;
  }

  onReading(listener: (reading: IBookooMonitorReading) => void): () => void {
    this.readingListeners.add(listener);
    return () => this.readingListeners.delete(listener);
  }

  onStateChange(listener: (state: BookooConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  async connect(): Promise<void> {
    if (this.state !== "disconnected") {
      throw new Error("Bookoo Espresso Monitor is already connecting or connected");
    }
    this.setState("connecting");
    try {
      const device = await this.bluetooth.requestDevice({
        filters: [{ services: [BOOKOO_MONITOR_SERVICE_UUID] }],
      });
      device.addEventListener("gattserverdisconnected", this.handleGattDisconnected);
      this.device = device;

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Bookoo Espresso Monitor GATT server is unavailable");

      const service = await server.getPrimaryService(BOOKOO_MONITOR_SERVICE_UUID);
      this.commandCharacteristic = await service.getCharacteristic(
        BOOKOO_MONITOR_COMMAND_CHARACTERISTIC_UUID,
      );
      this.extractionCharacteristic = await service.getCharacteristic(
        BOOKOO_MONITOR_EXTRACTION_CHARACTERISTIC_UUID,
      );

      this.extractionCharacteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleExtractionNotification,
      );
      await this.extractionCharacteristic.startNotifications();

      this.setState("connected");
    } catch (error) {
      this.teardown();
      throw error;
    }
  }

  disconnect(): void {
    this.teardown();
  }

  async startExtraction(): Promise<void> {
    await this.sendCommand(MONITOR_START_EXTRACTION_COMMAND);
  }

  async stopExtraction(): Promise<void> {
    await this.sendCommand(MONITOR_STOP_EXTRACTION_COMMAND);
  }

  private async sendCommand(command: Uint8Array<ArrayBuffer>): Promise<void> {
    if (!this.commandCharacteristic) throw new Error("Bookoo Espresso Monitor is not connected");
    await this.commandCharacteristic.writeValueWithoutResponse(command);
  }

  private readonly handleExtractionNotification = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (!data) return;

    const reading = decodeMonitorPressurePacket(data);
    if (!reading) return;

    for (const listener of this.readingListeners) listener(reading);
  };

  private readonly handleGattDisconnected = (): void => {
    this.teardown();
  };

  private teardown(): void {
    this.extractionCharacteristic?.removeEventListener(
      "characteristicvaluechanged",
      this.handleExtractionNotification,
    );
    this.device?.removeEventListener("gattserverdisconnected", this.handleGattDisconnected);
    this.device?.gatt?.disconnect();
    this.device = null;
    this.commandCharacteristic = null;
    this.extractionCharacteristic = null;
    this.setState("disconnected");
  }

  private setState(state: BookooConnectionState): void {
    this.state = state;
    for (const listener of this.stateListeners) listener(state);
  }
}
