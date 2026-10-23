/// <reference types="web-bluetooth" />
import type {
  BookooAutomaticModeEventType,
  BookooConnectionState,
  IBookooScaleAutomaticModeEvent,
  IBookooScalePowderWeightReading,
  IBookooScaleReading,
} from "../interfaces/bookoo-ble.interface";

export const BOOKOO_SCALE_SERVICE_UUID = "00000ffe-0000-1000-8000-00805f9b34fb";
export const BOOKOO_SCALE_COMMAND_CHARACTERISTIC_UUID = "0000ff12-0000-1000-8000-00805f9b34fb";
export const BOOKOO_SCALE_WEIGHT_CHARACTERISTIC_UUID = "0000ff11-0000-1000-8000-00805f9b34fb";

const COMMAND_PRODUCT_NUMBER = 0x03;
const COMMAND_TYPE = 0x0a;

/** Builds a 6-byte scale command (`03 0A <data1> <data2> <data3> <checksum>`) with the documented XOR checksum. */
const buildScaleCommand = (
  data1: number,
  data2: number,
  data3: number,
): Uint8Array<ArrayBuffer> => {
  const checksum = COMMAND_PRODUCT_NUMBER ^ COMMAND_TYPE ^ data1 ^ data2 ^ data3;
  return Uint8Array.of(COMMAND_PRODUCT_NUMBER, COMMAND_TYPE, data1, data2, data3, checksum);
};

export const SCALE_TARE_COMMAND = buildScaleCommand(0x01, 0x00, 0x00);
export const SCALE_START_TIMER_COMMAND = buildScaleCommand(0x04, 0x00, 0x00);
export const SCALE_TARE_AND_START_TIMER_COMMAND = buildScaleCommand(0x07, 0x00, 0x00);
export const SCALE_STOP_TIMER_COMMAND = buildScaleCommand(0x05, 0x00, 0x00);
export const SCALE_RESET_TIMER_COMMAND = buildScaleCommand(0x06, 0x00, 0x00);
/** Ultra only (all release firmware); ignored by scales that don't implement it. */
export const SCALE_CALIBRATE_COMMAND = buildScaleCommand(0x09, 0x00, 0x00);
/** Ultra only, release firmware V4.0.0+. */
export const SCALE_SHUTDOWN_COMMAND = buildScaleCommand(0x15, 0x00, 0x00);
/**
 * Resets the scale's automatic-shutdown countdown without changing its configured duration.
 * Ultra only, release firmware V4.0.1+. The upstream protocol docs recommend sending this
 * periodically rather than only right before shutdown, to keep a long-idle connection alive -
 * `BookooScaleConnection` does this automatically (see `KEEP_AWAKE_INTERVAL_MS`) while connected,
 * since a scale that auto-shuts-off mid-brew drops its BLE connection and looks like a failed
 * pairing the next time someone tries to reconnect.
 */
export const SCALE_RESET_AUTO_SHUTDOWN_COMMAND = buildScaleCommand(0x25, 0x00, 0x00);

export type BookooBeepVolume = 0 | 1 | 2 | 3;

/** 0 mutes the beeper; 1-3 are low/medium/high volume. */
export const buildSetBeepVolumeCommand = (level: BookooBeepVolume): Uint8Array<ArrayBuffer> =>
  buildScaleCommand(0x02, 0x00, level);

/** Automatic shutdown after this many idle minutes, 5-30. */
export const buildSetAutoOffDurationMinutesCommand = (
  minutes: number,
): Uint8Array<ArrayBuffer> => buildScaleCommand(0x03, 0x00, minutes);

export const buildSetFlowSmoothingCommand = (enabled: boolean): Uint8Array<ArrayBuffer> =>
  buildScaleCommand(0x08, enabled ? 0x01 : 0x00, 0x00);

/** Ultra only, beta firmware V3.2.4+ / release firmware V4.0.0+. Valid range 0.1-999.9 g. */
export const buildSetPowderWeightCommand = (grams: number): Uint8Array<ArrayBuffer> => {
  const scaled = Math.round(grams * 10);
  return buildScaleCommand(0x0d, (scaled >> 8) & 0xff, scaled & 0xff);
};

export type BookooAutomaticTargetMode = "timing" | "ratio";
export type BookooAutomaticStopCondition = "flowStopped" | "filterRemoved" | "serverRemoved";

const AUTOMATIC_TARGET_MODE_BYTE: Record<BookooAutomaticTargetMode, number> = {
  timing: 0x01,
  ratio: 0x02,
};
const AUTOMATIC_STOP_CONDITION_BYTE: Record<BookooAutomaticStopCondition, number> = {
  flowStopped: 0x00,
  filterRemoved: 0x01,
  serverRemoved: 0x02,
};

/** Ultra only, release firmware V4.0.0+ per-mode format (the V3.1.2-and-earlier single-mode format isn't implemented here). */
export const buildSetAutomaticStopConditionCommand = (
  targetMode: BookooAutomaticTargetMode,
  stopCondition: BookooAutomaticStopCondition,
): Uint8Array<ArrayBuffer> =>
  buildScaleCommand(
    0x0b,
    AUTOMATIC_TARGET_MODE_BYTE[targetMode],
    AUTOMATIC_STOP_CONDITION_BYTE[stopCondition],
  );

const WEIGHT_PACKET_TYPE = 0x0b;
const POWDER_WEIGHT_PACKET_TYPE = 0x0f;
const AUTOMATIC_MODE_EVENT_PACKET_TYPE = 0x0d;
/** BYTE1-BYTE20 per the Bookoo Scale protocol, for every notification packet type; BYTE20 is the checksum. */
const SCALE_PACKET_LENGTH = 20;
/** ASCII '-' - the documented sign byte for a negative weight/flow/result reading. Any other value means positive. */
const NEGATIVE_SIGN_BYTE = 0x2d;

const checksumMatches = (data: DataView, length: number): boolean => {
  let checksum = 0;
  for (let i = 0; i < length - 1; i++) checksum ^= data.getUint8(i);
  return checksum === data.getUint8(length - 1);
};

/**
 * Decodes a Bookoo Scale weight-data notification (characteristic `0xFF11`, packet type `0x0B`).
 * Returns null for a too-short, wrong-type, or checksum-failed packet.
 */
export const decodeScaleWeightPacket = (data: DataView): IBookooScaleReading | null => {
  if (data.byteLength < SCALE_PACKET_LENGTH) return null;
  if (data.getUint8(1) !== WEIGHT_PACKET_TYPE) return null;
  if (!checksumMatches(data, SCALE_PACKET_LENGTH)) return null;

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
 * Decodes a Bookoo Ultra Scale powder-weight notification (characteristic `0xFF11`, packet type
 * `0x0F`). Returns null for a too-short, wrong-type, or checksum-failed packet.
 */
export const decodeScalePowderWeightPacket = (
  data: DataView,
): IBookooScalePowderWeightReading | null => {
  if (data.byteLength < SCALE_PACKET_LENGTH) return null;
  if (data.getUint8(1) !== POWDER_WEIGHT_PACKET_TYPE) return null;
  if (!checksumMatches(data, SCALE_PACKET_LENGTH)) return null;

  const magnitude = ((data.getUint8(3) << 16) | (data.getUint8(4) << 8) | data.getUint8(5)) / 100;
  const powderWeightGrams = data.getUint8(2) === NEGATIVE_SIGN_BYTE ? -magnitude : magnitude;

  return { powderWeightGrams };
};

const AUTOMATIC_MODE_EVENT_TYPE_BY_BYTE: Record<number, BookooAutomaticModeEventType> = {
  0x00: "stopped",
  0x01: "started",
  0x02: "ready",
  0x03: "exitReady",
  0x04: "exitDone",
};

/**
 * Decodes a Bookoo Ultra Scale automatic-mode event/settlement notification (characteristic
 * `0xFF11`, packet type `0x0D`). Returns null for a too-short, wrong-type, unrecognized-event, or
 * checksum-failed packet.
 */
export const decodeScaleAutomaticModeEventPacket = (
  data: DataView,
): IBookooScaleAutomaticModeEvent | null => {
  if (data.byteLength < SCALE_PACKET_LENGTH) return null;
  if (data.getUint8(1) !== AUTOMATIC_MODE_EVENT_PACKET_TYPE) return null;
  if (!checksumMatches(data, SCALE_PACKET_LENGTH)) return null;

  const eventType = AUTOMATIC_MODE_EVENT_TYPE_BY_BYTE[data.getUint8(2)];
  if (!eventType) return null;

  const timeMs = (data.getUint8(3) << 16) | (data.getUint8(4) << 8) | data.getUint8(5);

  const weightMagnitude =
    ((data.getUint8(7) << 16) | (data.getUint8(8) << 8) | data.getUint8(9)) / 100;
  const weightGrams = data.getUint8(6) === NEGATIVE_SIGN_BYTE ? -weightMagnitude : weightMagnitude;

  const resultMagnitude = ((data.getUint8(11) << 8) | data.getUint8(12)) / 100;
  const result = data.getUint8(10) === NEGATIVE_SIGN_BYTE ? -resultMagnitude : resultMagnitude;

  return { eventType, timeMs, weightGrams, result };
};

/** How often to send `SCALE_RESET_AUTO_SHUTDOWN_COMMAND` while connected; comfortably under the shortest configurable auto-off duration (5 minutes). */
const KEEP_AWAKE_INTERVAL_MS = 60_000;

/**
 * Web Bluetooth connection to a Bookoo Scale (Mini/Ultra). Pairing, GATT I/O, and notification
 * subscription all require the main thread - Web Bluetooth isn't exposed to workers in any
 * shipping browser - so this owns the live connection directly rather than proxying through one.
 * The `decodeScale*Packet` functions above stay pure so they can still be reused off-thread later.
 */
export class BookooScaleConnection {
  private readonly bluetooth: Bluetooth;
  private device: BluetoothDevice | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private weightCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private state: BookooConnectionState = "disconnected";
  private keepAwakeTimerId: ReturnType<typeof setInterval> | null = null;
  private readonly readingListeners = new Set<(reading: IBookooScaleReading) => void>();
  private readonly powderWeightListeners = new Set<
    (reading: IBookooScalePowderWeightReading) => void
  >();
  private readonly automaticModeEventListeners = new Set<
    (event: IBookooScaleAutomaticModeEvent) => void
  >();
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

  /** Ultra only - never fires for a scale that doesn't send powder-weight notifications. */
  onPowderWeightReading(listener: (reading: IBookooScalePowderWeightReading) => void): () => void {
    this.powderWeightListeners.add(listener);
    return () => this.powderWeightListeners.delete(listener);
  }

  /** Ultra only - never fires for a scale that doesn't send automatic-mode notifications. */
  onAutomaticModeEvent(listener: (event: IBookooScaleAutomaticModeEvent) => void): () => void {
    this.automaticModeEventListeners.add(listener);
    return () => this.automaticModeEventListeners.delete(listener);
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
        this.handleScaleNotification,
      );
      await this.weightCharacteristic.startNotifications();

      this.setState("connected");
      this.keepAwakeTimerId = setInterval(this.sendKeepAwakePing, KEEP_AWAKE_INTERVAL_MS);
    } catch (error) {
      this.teardown();
      throw error;
    }
  }

  disconnect(): void {
    this.teardown();
  }

  async tare(): Promise<void> {
    await this.sendCommand(SCALE_TARE_COMMAND);
  }

  async startTimer(): Promise<void> {
    await this.sendCommand(SCALE_START_TIMER_COMMAND);
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

  /** Ultra only; ignored by scales that don't implement it. */
  async calibrate(): Promise<void> {
    await this.sendCommand(SCALE_CALIBRATE_COMMAND);
  }

  /** Ultra only, release firmware V4.0.0+. Not valid while charging. */
  async shutdown(): Promise<void> {
    await this.sendCommand(SCALE_SHUTDOWN_COMMAND);
  }

  async setBeepVolume(level: BookooBeepVolume): Promise<void> {
    await this.sendCommand(buildSetBeepVolumeCommand(level));
  }

  /** Minutes of idle time before automatic shutdown, 5-30. */
  async setAutoOffDurationMinutes(minutes: number): Promise<void> {
    await this.sendCommand(buildSetAutoOffDurationMinutesCommand(minutes));
  }

  async setFlowSmoothing(enabled: boolean): Promise<void> {
    await this.sendCommand(buildSetFlowSmoothingCommand(enabled));
  }

  /** Ultra only, beta firmware V3.2.4+ / release firmware V4.0.0+. Valid range 0.1-999.9 g. */
  async setPowderWeight(grams: number): Promise<void> {
    await this.sendCommand(buildSetPowderWeightCommand(grams));
  }

  /** Ultra only, release firmware V4.0.0+. */
  async setAutomaticStopCondition(
    targetMode: BookooAutomaticTargetMode,
    stopCondition: BookooAutomaticStopCondition,
  ): Promise<void> {
    await this.sendCommand(buildSetAutomaticStopConditionCommand(targetMode, stopCondition));
  }

  private async sendCommand(command: Uint8Array<ArrayBuffer>): Promise<void> {
    if (!this.commandCharacteristic) throw new Error("Bookoo Scale is not connected");
    await this.commandCharacteristic.writeValueWithoutResponse(command);
  }

  /** Fire-and-forget: a dropped keep-awake write isn't worth surfacing, the next interval tick retries it anyway. */
  private readonly sendKeepAwakePing = (): void => {
    this.commandCharacteristic
      ?.writeValueWithoutResponse(SCALE_RESET_AUTO_SHUTDOWN_COMMAND)
      .catch(() => {});
  };

  private readonly handleScaleNotification = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const data = characteristic.value;
    if (!data || data.byteLength < 2) return;

    switch (data.getUint8(1)) {
      case WEIGHT_PACKET_TYPE: {
        const reading = decodeScaleWeightPacket(data);
        if (reading) for (const listener of this.readingListeners) listener(reading);
        break;
      }
      case POWDER_WEIGHT_PACKET_TYPE: {
        const reading = decodeScalePowderWeightPacket(data);
        if (reading) for (const listener of this.powderWeightListeners) listener(reading);
        break;
      }
      case AUTOMATIC_MODE_EVENT_PACKET_TYPE: {
        const modeEvent = decodeScaleAutomaticModeEventPacket(data);
        if (modeEvent) for (const listener of this.automaticModeEventListeners) listener(modeEvent);
        break;
      }
      default:
        break;
    }
  };

  private readonly handleGattDisconnected = (): void => {
    this.teardown();
  };

  private teardown(): void {
    if (this.keepAwakeTimerId !== null) {
      clearInterval(this.keepAwakeTimerId);
      this.keepAwakeTimerId = null;
    }
    this.weightCharacteristic?.removeEventListener(
      "characteristicvaluechanged",
      this.handleScaleNotification,
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
