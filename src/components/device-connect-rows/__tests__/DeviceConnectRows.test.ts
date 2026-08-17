import { signal } from "@lit-labs/preact-signals";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookooConnectionState } from "../../../shared/interfaces/bookoo-ble.interface";

/**
 * `DeviceConnectRows` just wires two rows straight to `device-connection.store`'s exported
 * signals/functions - mocking the whole store (rather than driving the real BLE stack, already
 * covered by `device-connection.store.test.ts`) keeps this test focused on that wiring: the
 * right label/state/pill per row, and that each row's connect/disconnect action calls the
 * matching store function.
 */
const scaleConnectionStateSignal = signal<BookooConnectionState>("disconnected");
const monitorConnectionStateSignal = signal<BookooConnectionState>("disconnected");
const connectScale = vi.fn();
const disconnectScale = vi.fn();
const connectMonitor = vi.fn();
const disconnectMonitor = vi.fn();

vi.mock("../../../shared/stores/device-connection.store", () => ({
  get scaleConnectionStateSignal() {
    return scaleConnectionStateSignal;
  },
  get monitorConnectionStateSignal() {
    return monitorConnectionStateSignal;
  },
  connectScale: (...args: unknown[]) => connectScale(...args),
  disconnectScale: (...args: unknown[]) => disconnectScale(...args),
  connectMonitor: (...args: unknown[]) => connectMonitor(...args),
  disconnectMonitor: (...args: unknown[]) => disconnectMonitor(...args),
}));

const { DeviceConnectRows } = await import("../DeviceConnectRows");
await import("../brew-device-connect-rows");

describe("brew-device-connect-rows", () => {
  let element: InstanceType<typeof DeviceConnectRows>;

  beforeEach(async () => {
    scaleConnectionStateSignal.value = "disconnected";
    monitorConnectionStateSignal.value = "disconnected";
    connectScale.mockClear();
    disconnectScale.mockClear();
    connectMonitor.mockClear();
    disconnectMonitor.mockClear();

    element = document.createElement("brew-device-connect-rows") as InstanceType<
      typeof DeviceConnectRows
    >;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders a Bookoo Scale row and an Espresso Monitor row, each with a status pill", () => {
    const rowLabels = Array.from(element.shadowRoot?.querySelectorAll(".row-label") ?? []).map(
      (label) => label.textContent,
    );
    expect(rowLabels).toEqual(["Bookoo Scale", "Espresso Monitor"]);
    expect(element.shadowRoot?.querySelectorAll("brew-connection-status-pill")).toHaveLength(2);
  });

  it("reflects each device's connection state onto its pill and action", async () => {
    scaleConnectionStateSignal.value = "connected";
    monitorConnectionStateSignal.value = "connecting";
    await element.updateComplete;

    const pills = element.shadowRoot?.querySelectorAll("brew-connection-status-pill");
    expect(pills?.[0].getAttribute("state")).toBe("connected");
    expect(pills?.[1].getAttribute("state")).toBe("connecting");

    const actions = element.shadowRoot?.querySelectorAll("brew-device-connect-action");
    expect(actions?.[0].getAttribute("state")).toBe("connected");
    expect(actions?.[1].getAttribute("state")).toBe("connecting");
  });

  it("calls connectScale/disconnectScale when the scale row's action fires connect-click/disconnect-click", async () => {
    const scaleAction = element.shadowRoot?.querySelector("brew-device-connect-action");
    scaleAction?.dispatchEvent(new CustomEvent("connect-click", { bubbles: true, composed: true }));
    expect(connectScale).toHaveBeenCalledTimes(1);

    scaleAction?.dispatchEvent(
      new CustomEvent("disconnect-click", { bubbles: true, composed: true }),
    );
    expect(disconnectScale).toHaveBeenCalledTimes(1);

    expect(connectMonitor).not.toHaveBeenCalled();
    expect(disconnectMonitor).not.toHaveBeenCalled();
  });

  it("calls connectMonitor/disconnectMonitor when the monitor row's action fires connect-click/disconnect-click", async () => {
    const monitorAction = element.shadowRoot?.querySelectorAll("brew-device-connect-action")[1];
    monitorAction?.dispatchEvent(
      new CustomEvent("connect-click", { bubbles: true, composed: true }),
    );
    expect(connectMonitor).toHaveBeenCalledTimes(1);

    monitorAction?.dispatchEvent(
      new CustomEvent("disconnect-click", { bubbles: true, composed: true }),
    );
    expect(disconnectMonitor).toHaveBeenCalledTimes(1);

    expect(connectScale).not.toHaveBeenCalled();
    expect(disconnectScale).not.toHaveBeenCalled();
  });
});
