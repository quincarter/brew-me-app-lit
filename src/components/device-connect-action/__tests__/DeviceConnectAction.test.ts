import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../brew-device-connect-action";
import type { DeviceConnectAction } from "../DeviceConnectAction";

describe("brew-device-connect-action", () => {
  let element: DeviceConnectAction;

  beforeEach(async () => {
    element = document.createElement("brew-device-connect-action") as DeviceConnectAction;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders a Connect button and fires connect-click when disconnected", async () => {
    element.state = "disconnected";
    await element.updateComplete;

    const button = element.shadowRoot?.querySelector("brew-button");
    expect(button?.textContent?.trim()).toBe("Connect");

    const listener = vi.fn();
    element.addEventListener("connect-click", listener);
    button?.dispatchEvent(new CustomEvent("button-click", { bubbles: true, composed: true }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("renders a Cancel button and fires disconnect-click when connecting", async () => {
    element.state = "connecting";
    await element.updateComplete;

    const button = element.shadowRoot?.querySelector("brew-button");
    expect(button?.textContent?.trim()).toBe("Cancel");

    const listener = vi.fn();
    element.addEventListener("disconnect-click", listener);
    button?.dispatchEvent(new CustomEvent("button-click", { bubbles: true, composed: true }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("renders a disconnect icon button and fires disconnect-click when connected", async () => {
    element.state = "connected";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-button")).toBeNull();
    const iconButton = element.shadowRoot?.querySelector("brew-icon-button");
    expect(iconButton).not.toBeNull();
    expect(iconButton?.getAttribute("aria-label")).toBe("Disconnect");

    const listener = vi.fn();
    element.addEventListener("disconnect-click", listener);
    iconButton?.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
