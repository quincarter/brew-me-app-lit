import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-connection-status-pill";
import type { ConnectionStatusPill } from "../ConnectionStatusPill";

describe("brew-connection-status-pill", () => {
  let element: ConnectionStatusPill;

  beforeEach(async () => {
    element = document.createElement("brew-connection-status-pill") as ConnectionStatusPill;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("defaults to the disconnected state", async () => {
    expect(element.state).toBe("disconnected");
    expect(element.shadowRoot?.querySelector(".label")?.textContent).toBe("Disconnected");
    expect(element.getAttribute("state")).toBe("disconnected");
  });

  it("renders a dot and the Connecting… label when connecting", async () => {
    element.state = "connecting";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".dot")).not.toBeNull();
    expect(element.shadowRoot?.querySelector(".label")?.textContent).toBe("Connecting…");
    expect(element.getAttribute("state")).toBe("connecting");
  });

  it("renders the Connected label when connected", async () => {
    element.state = "connected";
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".label")?.textContent).toBe("Connected");
    expect(element.getAttribute("state")).toBe("connected");
  });

  it("reflects the state property to the state attribute", async () => {
    element.state = "connected";
    await element.updateComplete;
    expect(element.getAttribute("state")).toBe("connected");

    element.state = "disconnected";
    await element.updateComplete;
    expect(element.getAttribute("state")).toBe("disconnected");
  });
});
